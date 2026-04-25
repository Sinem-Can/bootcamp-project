from app.services.scoring import score_product_for_user


def test_score_red_when_allergen_synonym_matches():
  result = score_product_for_user(
    product_icerik='İçindekiler: Süt yağı, şeker',
    allergens=['laktoz'],
    undesired=[],
  )
  assert result['status'] == 'RED'
  assert result['matched_allergens']


def test_score_yellow_when_undesired_matches():
  result = score_product_for_user(
    product_icerik='İçindekiler: palm yağı, tuz',
    allergens=[],
    undesired=['palm yağı'],
  )
  assert result['status'] == 'YELLOW'
  assert result['matched_undesired'] == ['palm yağı']


def test_score_green_when_no_matches():
  result = score_product_for_user(
    product_icerik='İçindekiler: yulaf, tuz',
    allergens=['laktoz'],
    undesired=['palm yağı'],
  )
  assert result['status'] == 'GREEN'
