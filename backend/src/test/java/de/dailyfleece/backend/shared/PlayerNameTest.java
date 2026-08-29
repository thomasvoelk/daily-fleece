package de.dailyfleece.backend.shared;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class PlayerNameTest {

    @Test
    @SuppressWarnings("NullAway")
    void rejects_null_value() {
        assertThatThrownBy(() -> new PlayerName(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("PlayerName must not be blank");
    }

    @Test
    void rejects_blank_value() {
        assertThatThrownBy(() -> new PlayerName(" "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("PlayerName must not be blank");
    }
}
