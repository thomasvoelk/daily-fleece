package de.dailyfleece.backend.quiz.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class SessionKeyTest {

    private static final ProjectId PROJECT = new ProjectId("default");
    private static final LocalDate DATE = LocalDate.parse("2026-06-10");

    @Test
    void constructs_with_valid_values() {
        SessionKey key = new SessionKey(PROJECT, DATE);

        assertThat(key.projectId()).isEqualTo(PROJECT);
        assertThat(key.date()).isEqualTo(DATE);
    }

    @Test
    @SuppressWarnings("NullAway")
    void rejects_null_project_id() {
        assertThatThrownBy(() -> new SessionKey(null, DATE)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @SuppressWarnings("NullAway")
    void rejects_null_date() {
        assertThatThrownBy(() -> new SessionKey(PROJECT, null)).isInstanceOf(IllegalArgumentException.class);
    }
}
