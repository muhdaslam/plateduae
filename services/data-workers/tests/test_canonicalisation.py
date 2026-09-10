from tasks.canonicalisation import _cosine_similarity, _detect_size_variant, _lexical_score


def test_cosine_similarity_identical_vectors() -> None:
    assert _cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0


def test_cosine_similarity_orthogonal_vectors() -> None:
    assert _cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_cosine_similarity_zero_vector_does_not_divide_by_zero() -> None:
    assert _cosine_similarity([0.0, 0.0], [1.0, 0.0]) == 0.0


def test_lexical_score_exact_alias_match_is_high() -> None:
    score = _lexical_score("Shawarma Djaj", "Chicken Shawarma", ["Shawarma Djaj", "Chicken Shawarma Sandwich"])
    assert score > 0.95


def test_lexical_score_unrelated_text_is_low() -> None:
    score = _lexical_score("Xyzabc Purple Glow Elixir", "Chicken Shawarma", ["Shawarma Djaj"])
    assert score < 0.5


def test_detect_size_variant_finds_large() -> None:
    assert _detect_size_variant("Chicken Shawarma - Large") == {"size": "large"}


def test_detect_size_variant_none_when_absent() -> None:
    assert _detect_size_variant("Chicken Shawarma Sandwich") == {}


def test_detect_size_variant_word_boundary_avoids_false_positive() -> None:
    # "regular" should not match inside an unrelated longer word.
    assert _detect_size_variant("Regulariser Sauce") == {}
