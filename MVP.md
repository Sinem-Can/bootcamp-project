# **Ürün Gereksinim Dokümanı (PRD): Sağlıklı Market Rehberi \- MVP Fazı**

Bu doküman, "Sağlıklı Market Rehberi" mobil uygulamasının MVP (Minimum Viable Product) aşaması için gerekli olan işlevsel gereksinimleri, kullanıcı hikayelerini ve teknik beklentileri tanımlar. Business Product Owner (BPO) tarafından Teknik Product Owner (TPO) ve geliştirme ekibine rehberlik etmesi amacıyla hazırlanmıştır.

## **1\. Proje Vizyonu ve Hedef**

Kullanıcıların paketli gıda içeriklerini kendi sağlık profillerine göre analiz etmelerini sağlayan, riskli ürünler yerine temiz içerikli ve bütçe dostu alternatifler öneren bir mobil platform oluşturmak. İlk aşamada **İstanbul** pilot bölgesi ve **Paketli Atıştırmalıklar** kategorisi hedeflenmektedir.

## **2\. MVP Özellik Seti (Feature Set)**

| ID | Özellik (Feature) | Açıklama | Öncelik |
| :---- | :---- | :---- | :---- |
| F1 | Kullanıcı Profil Matrisi | Alerjen, diyet tipi ve istenmeyen madde seçim alanı. | P0 (Kritik) |
| F2 | Barkod Tarayıcı (OCR) | Kamerayla EAN-13/8 barkod okuma ve API sorgulama. | P0 (Kritik) |
| F3 | Trafik Lambası Analiz UI | Kırmızı/Sarı/Yeşil skorlama ve içerik vurgulama. | P0 (Kritik) |
| F4 | Basit Alternatif Motoru | Kategori ve fiyat segmentine göre temiz ürün eşleme. | P1 (Yüksek) |
| F5 | Manuel Veri Giriş Akışı | Bulunmayan ürünler için fotoğraf yükleme mekanizması. | P1 (Yüksek) |

## **3\. Kritik Kullanıcı Hikayeleri (User Stories)**

### **US.01: Ürün Analizi ve Skorlama**

**Bir kullanıcı olarak,** bir ürünün barkodunu okutmak istiyorum, **böylece** ürünün benim sağlık profilime (alerjen/diyet) uygun olup olmadığını anında görebileyim.

* **Kabul Kriteri 1:** Tarama işlemi 2 saniyenin altında gerçekleşmelidir.  
* **Kabul Kriteri 2:** Eğer ürün alerjen listemdeki bir maddeyi içeriyorsa sonuç "KIRMIZI" olmalı ve ilgili madde görsel olarak vurgulanmalıdır.  
* **Kabul Kriteri 3:** Eğer ürün sadece istenmeyen katkı maddesi (örn. Palm Yağı) içeriyorsa "SARI" uyarı verilmelidir.

### **US.02: Alternatif Öneri Mekanizması**

**Bir kullanıcı olarak,** bana uygun olmayan bir ürün gördüğümde, **böylece** aynı rafta bulabileceğim daha sağlıklı ve benzer fiyatlı seçenekleri keşfetmek istiyorum.

* **Kabul Kriteri 1:** Alternatifler sadece kullanıcının profiline göre "YEŞİL" (Tam Uygun) olan ürünlerden seçilmelidir.  
* **Kabul Kriteri 2:** Önerilen ürün, taranan ürünle aynı alt kategoride olmalıdır.  
* **Kabul Kriteri 3:** Önerilen ürünün fiyat segmenti (Ekonomik/Orta/Premium), taranan ürünle aynı veya daha düşük olmalıdır.

## **4\. İş Mantığı ve Teknik Beklentiler (Brain)**

* **Veri Eşleme Algoritması:** Ürün içerik string'leri ile kullanıcı kısıtları arasında esnek (fuzzy) bir arama yapılmalıdır (Örn: "Süt Tozu" içeren ürünün "Laktoz" kısıtına takılması).  
* **Fiyat Modelleme:** MVP'de kuruş fiyatı tutulmayacak; ürünler 3 ana segmentte ($, $$, $$$) etiketlenecektir.  
* **BPO Özel Notu:** Admin paneli MVP kapsamı dışındadır. Bulunmayan ürün fotoğrafları bir Cloud Storage klasörüne düşmeli ve ilgili metadata (barkod no) bir veritabanı tablosuna (Queue) yazılmalıdır.

## **5\. Gelecek Fazlara Hazırlık (V2/V3 Projeksiyonu)**

Teknik mimarinin aşağıdaki maddelere ölçeklenebilir olması beklenmektedir:

* Büyük ölçekli veri (large-scale data) üzerinde makine öğrenimi destekli talep tahmini.  
* Çok boyutlu kar ve kategori optimizasyonu algoritmaları.  
* Affiliate (satış ortaklığı) entegrasyonları için üçüncü taraf API destekleri.
