package de.dailyfleece.backend.quiz.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class PhotoIdTest {

    private static final String VALID = "aaaaaaaaaaaaaaaaaaaaaaaa"; // 24 hex chars

    @Test
    void blank_value_is_rejected() {
        assertThatThrownBy(() -> new PhotoId("   ")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void wrong_length_is_rejected() {
        assertThatThrownBy(() -> new PhotoId("abc123")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void non_hex_characters_are_rejected() {
        assertThatThrownBy(() -> new PhotoId("zzzzzzzzzzzzzzzzzzzzzzzz")) // 24 chars, not hex
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void valid_24_char_hex_is_accepted() {
        PhotoId id = new PhotoId(VALID);
        assertThat(id.value()).isEqualTo(VALID);
    }

    @Test
    void uppercase_hex_is_rejected() {
        assertThatThrownBy(() -> new PhotoId("AAAAAAAAAAAAAAAAAAAAAAAA")) // uppercase — not ObjectId format
                .isInstanceOf(IllegalArgumentException.class);
    }
}
