# **TEKNİK ÜRÜN GEREKSİNİM DOKÜMANI (T-PRD) \- V2.0**

**Ürün:** TemizSepet (MVP Fazı) **Platform:** Android (Play Store) & Bağımsız Backend API **Belge Durumu:** Onaylandı / Geliştirmeye Hazır (Vendor-Independent Architecture)

## **1\. Proje Vizyonu ve Kapsam**

Kullanıcıların paketli gıda içeriklerini kendi sağlık profillerine (alerjen, diyet tipi, istenmeyen maddeler) göre analiz etmelerini sağlayan, riskli ürünler yerine temiz içerikli ve bütçe dostu alternatifler öneren bir mobil platform oluşturmak.

* **Pilot Bölge:** İstanbul  
* **Kategori:** Paketli Atıştırmalıklar

## **2\. Sistem Mimarisi ve Teknoloji Yığını**

Hiçbir sağlayıcıya (vendor lock-in) doğrudan bağımlı olmayan, ekibin kendi kontrolünde ölçekleyebileceği altyapı bileşenleri:

* **Frontend (Mobil):** React Native (Expo) \- Yalnızca Android derlemesi alınacaktır.  
* **Backend:** FastAPI (Python) \- Render üzerinde host edilecek, asenkron ve yüksek performanslı.  
* **Veritabanı:** PostgreSQL (Bağımsız) \- SQLAlchemy / SQLModel ORM aracı ile yönetilecek.  
* **Kimlik Doğrulama (Auth):** FastAPI üzerinde Custom JWT (JSON Web Token), şifreler bcrypt ile hash'lenecek. (Sadece E-posta/Şifre ile giriş).  
* **Storage (Depolama):** AWS S3 veya Cloudflare R2 (FastAPI üzerinden boto3 entegrasyonu).  
* **Kuyruk / Arka Plan İşleri:** FastAPI BackgroundTasks.  
* **Barkod Tarama (OCR):** Telefon işlemcisi üzerinden (Client-side) Google ML Kit Vision.

## **3\. Veritabanı Şeması (PostgreSQL)**

Sistemin temel veri yapısı aşağıdaki tablolardan oluşacaktır:

| Tablo Adı | Sütunlar (Alanlar) | Açıklama |
| :---- | :---- | :---- |
| **Users** | id (PK), email, hashed\_password, alerjenler (JSONB), diyet\_tipi (String), istenmeyen\_maddeler (JSONB) | Kullanıcı kimlik bilgileri ve sağlık profili esnek (JSONB) yapıda tutulur. |
| **Products** | barkod (PK), ad, kategori, fiyat\_segmenti (1, 2, 3), icerik (Text) | Ürün kataloğu. Fiyatlar kuruş bazlı değil, segmente (![][image1]) göre numaralandırılır. |
| **Missing\_Products** | id (PK), barkod\_no, image\_url, status, created\_at | Bulunamayan ürünlerin S3 linkleri ve barkodlarını tutan asenkron işlem kuyruğu. |

## **4\. Ekran Haritası ve UI Durumları (Screen & State Mapping)**

| Ekran ID | Ekran Adı | İçerik ve UI Bileşenleri | Beklenen Durumlar (States) |
| :---- | :---- | :---- | :---- |
| **SCR-01** | **Splash & Onboarding** | Logo animasyonu. "TemizSepet'e Hoş Geldin" kaydırmalı bilgi ekranları. | Loading, Ready |
| **SCR-02** | **Kayıt / Giriş** | E-posta, Şifre (gizle/göster), Aksiyon Butonları. | Idle, Submitting, Error |
| **SCR-03** | **Profil Matrisi** | Checkbox: Alerjenler, Diyet Tipi, İstenmeyenler. | Fetching\_Data, Saving, Success |
| **SCR-04** | **Ana Sayfa** | Profil özeti, Son Tarananlar, Dev "TARAMA YAP" butonu. | Idle, Empty\_State |
| **SCR-05** | **Kamera (Scanner)** | Tam ekran kamera vizörü, barkod çerçevesi, Flaş butonu. | Requesting\_Permission, Scanning |
| **SCR-06** | **Ürün Sonuç** | Trafik Lambası (🔴 🟡 🟢), Neden bu skor listesi. | Loading, Result\_Red, Result\_Green |
| **SCR-07** | **Alternatifler Modal** | Alternatif ürün kartları (Fiyat $, İsim, Resim). | Fetching, List\_Populated, Not\_Found |
| **SCR-08** | **Eksik Ürün Bildir** | Ürün fotoğraf çekimi, Gönder butonu. | Uploading\_to\_S3, Success\_Animation |

## **5\. API Kontratları Özeti (FastAPI Endpoints)**

* POST /auth/register & POST /auth/login: E-posta/şifre alır, JWT Access Token döner.  
* PUT /user/profile: Yetkilendirilmiş kullanıcının JSONB sağlık matrisini günceller.  
* GET /product/{barcode}: Fuzzy Matching çalıştırarak status (RED/YELLOW/GREEN) döner.  
* GET /product/alternatives/{barcode}: Algoritma filtrelerinden geçmiş sağlıklı (GREEN) alternatifleri döner.  
* POST /product/missing: Fotoğraf (multipart/form-data) ve barkodu alır, S3'e yükler.

## **6\. Jira/Linear Kullanıcı Hikayeleri ve Kabul Kriterleri (BDD)**

### **EPIC 1: Kimlik Doğrulama ve Profil Yönetimi**

**US 1.1: Kullanıcı Kaydı (Register)**

**Rol:** Yeni Kullanıcı

**İstek:** E-posta ve şifrem ile sisteme kayıt olmak istiyorum.

**Amaç:** Sağlık profilimi oluşturup verilerimi güvenle saklayabilmek için.

* **Kabul Kriteri 1:** Geçerli e-posta ve 8+ karakterli şifre girildiğinde, Backend şifreyi bcrypt ile hash'leyerek kaydetmeli, HTTP 201 dönmeli ve SCR-03'e yönlendirmelidir.  
* **Kabul Kriteri 2:** Geçersiz formatlarda API'ye istek atılmadan UI üzerinde hata gösterilmelidir.  
* **Kabul Kriteri 3:** Mevcut bir e-posta girilirse API HTTP 409 Conflict dönmeli, kullanıcıya uyarı verilmelidir.

**US 1.2: Sağlık Matrisini Güncelleme**

**Rol:** Kayıtlı Kullanıcı

**İstek:** Alerjenlerimi ve diyet tipimi uygulamaya kaydetmek istiyorum.

**Amaç:** Sistemin bana özel analiz yapabilmesi için.

* **Kabul Kriteri 1:** Kullanıcı SCR-03 ekranında seçim yapıp kaydettiğinde, JSON formatında ({"allergens": \["laktoz"\], "diet": "vegan"}) PUT isteği atılmalı ve DB güncellenmelidir.

### **EPIC 2: Barkod Okuma ve Analiz Motoru (Core)**

**US 2.1: Barkod Okuma Hızı (OCR)**

**Rol:** Uygulama Kullanıcısı

**İstek:** Kamerayı tuttuğum an okuma gerçekleşsin.

* **Kabul Kriteri 1:** Google ML Kit ile okuma cihaz üzerinde (client-side) en fazla 2 saniyede yapılmalı ve titreşim (haptic) geri bildirimi verilmelidir.  
* **Kabul Kriteri 2:** Okuma 5 saniye içinde başarılamazsa, manuel barkod numarası giriş seçeneği açılmalıdır.

**US 2.2: Fuzzy Matching ve Skorlama Algoritması**

**Rol:** Backend (FastAPI)

**İstek:** Okunan barkodu analiz edip kırmızı, sarı, yeşil skor atamak.

* **Kabul Kriteri 1 \[KIRMIZI\]:** Ürün içeriğinde kullanıcının "Alerjenler" listesinde olan bir maddenin kendisi veya eşanlamlısı (örn. Süt yağı \-\> Laktoz) varsa status: RED dönmeli ve riskli maddeler liste olarak verilmelidir.  
* **Kabul Kriteri 2 \[SARI\]:** Ürün alerjen içermiyor ancak "İstenmeyen Maddeler" (örn. Palm Yağı) içeriyorsa status: YELLOW dönmelidir.  
* **Kabul Kriteri 3 \[YEŞİL\]:** Hiçbir kısıta takılmayan ürünler için status: GREEN dönmelidir.

### **EPIC 3: Alternatif Motoru ve Manuel Veri Girişi**

**US 3.1: Alternatif Önerme Algoritması**

**Rol:** Uygulama Kullanıcısı

**İstek:** Kırmızı/Sarı ürüne karşılık daha temiz alternatifler görmek.

* **Kabul Kriteri 1:** Alternatifler çağrıldığında backend şu koşullara uyan ürünleri getirmelidir:  
  1. Products.kategori \== Taranan\_Kategori  
  2. Products.fiyat\_segmenti \<= Taranan\_Fiyat\_Segmenti  
  3. Fuzzy\_Match \== GREEN.  
* **Kabul Kriteri 2:** Uygun ürün yoksa API HTTP 404 dönmeli ve frontend'de "Kriterlere uygun ürün bulunamadı" mesajı çıkmalıdır.

**US 3.2: Eksik Ürün Bildirimi (Asenkron Upload)**

**Rol:** Uygulama Kullanıcısı

**İstek:** Bulunamayan ürünün resmini çekip sisteme yüklemek.

* **Kabul Kriteri 1:** UI üzerinden gönderilen fotoğraf, kullanıcıyı bekletmeden (anında başarı mesajı dönerek) arka planda FastAPI BackgroundTasks aracılığıyla AWS S3 / Cloudflare R2'ye yüklenmelidir.  
* **Kabul Kriteri 2:** S3 URL'i ve ilgili barkod Missing\_Products tablosuna kaydedilmelidir.

## **7\. Gelecek Faz (V2/V3) Mimari Projeksiyonu**

* **Makine Öğrenimi (ML):** İlerleyen aşamalarda Python altyapısı sayesinde talep tahmini modelleri doğrudan entegre edilecektir.  
* **Kar Optimizasyonu:** Çok boyutlu algoritmalar mevcut veri kümesinde çalıştırılacaktır.  
* **Affiliate (Satış Ortaklığı):** Yeşil etiketli ürünlerin online satın alınabilmesi için dış API bağlantıları kurulacaktır.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAASCAYAAAAdZl26AAAB9UlEQVR4Xu2WsUvDQBTGn2hFQRykCEUQHR0URHQqCKKji7ujKOokiKND/wBBB+nmrIOIguCg6CBaU7TQ0kVxc+jYwUGF+r3mXbnE9F5A0KUfvObyfve9y+VySYlaaunv5BGt5Ikmwnkj8AwiFc7HlebXeFMdErXDWER8IWqI1yeiAcNvibo5J4z7FJHrs2u4pPk17lSNqA13ffOBaBzGVRyncBxFbp452gnksvdEw55/hwZzRNOulbKl+TWuCoYkoiDtxiOEdpqPOB9B+01yjSVGfszUcEnzazyW0HkBxgruxHV45rxCYBuIZ8SlGSCuNL/GYwvGsuc/g2Us4aTNZJCK8JtHoiGba9L8Go8l2Ui7iA/EJyJh8zuiXqzQufAqD2pzTZpf47Hk+XtgBscDFNsJF0E+I5v8gvvaLI40v8YjhY4pxJa065tYlrSASPI5ii4Kr28yWa3TK6KuYLWf0vwaJ/x0oNMeOi0HS/uSCZT4YnkCiDT3hWeJOQ+A3EuJqIcHkLcG36lZ5pI/w/lcsLIvza9x82wfAeT4IgPVhYOtgVU9fxO9w3xtHh/+oIBvc154Fecnxo/3b7/UPo5aEc2v8YZwUdmoCdjyfvFXAvn9qAnYcvlZTo4JrIdzYWEZO8Mb11azC2RPXr7cLjXzG2m8pf/QNyZuS95STjKPAAAAAElFTkSuQmCC>