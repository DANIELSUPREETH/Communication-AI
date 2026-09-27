from app.services.speech_service import count_words, detect_filler_words, estimate_duration_seconds


def test_word_boundaries_are_respected():
    # "actual" must not count as "actually"; "likely" must not count as "like"; "also" not "so".
    assert detect_filler_words("The actual result was likely good, also fast.") == {}


def test_counts_fillers_case_insensitively():
    counts = detect_filler_words("Um, I basically, um, ACTUALLY built it. Uh, yeah.")
    assert counts == {"um": 2, "actually": 1, "basically": 1, "uh": 1}


def test_multi_word_fillers():
    assert detect_filler_words("It was, you know, hard. You  know?")["you know"] == 2


def test_like_as_verb_or_preposition_is_not_a_filler():
    assert "like" not in detect_filler_words("I would like to use tools like Docker. I like Python.")
    assert detect_filler_words("It was, like, really hard.")["like"] == 1


def test_so_only_counts_as_sentence_opener():
    assert "so" not in detect_filler_words("I refactored it so that it was faster.")
    assert detect_filler_words("So, I started the project.")["so"] == 1


def test_duration_estimate():
    assert estimate_duration_seconds("") == 0
    assert estimate_duration_seconds(" ".join(["word"] * 140)) == 60
    assert count_words("I'm here, ready.") == 3
