package de.dailyfleece.backend.player.api;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class CompanyIdTest {

    @Test
    @SuppressWarnings("NullAway")
    void rejects_null_value() {
        assertThatThrownBy(() -> new CompanyId(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("CompanyId must not be blank");
    }

    @Test
    void rejects_blank_value() {
        assertThatThrownBy(() -> new CompanyId(" "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("CompanyId must not be blank");
    }
}
