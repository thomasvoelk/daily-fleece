package de.dailyfleece.backend.quiz.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ProjectIdTest {

    @Test
    void constructs_with_valid_value() {
        assertThat(new ProjectId("default").value()).isEqualTo("default");
    }

    @Test
    @SuppressWarnings("NullAway")
    void rejects_null_value() {
        assertThatThrownBy(() -> new ProjectId(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejects_blank_value() {
        assertThatThrownBy(() -> new ProjectId("  ")).isInstanceOf(IllegalArgumentException.class);
    }
}
