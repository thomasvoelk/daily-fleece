package de.dailyfleece.backend.quiz.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SessionTest {

    @Test
    void new_session_starts_in_lobby_phase() {
        Session session = Session.create("2026-05-29");

        assertThat(session.phase()).isEqualTo(SessionPhase.LOBBY);
    }

    @Test
    void new_session_has_no_players() {
        Session session = Session.create("2026-05-29");

        assertThat(session.players()).isEmpty();
    }

    @Test
    void player_can_join_a_lobby_session() {
        Session session = Session.create("2026-05-29");

        session.join("player-1", "Thomas");

        assertThat(session.players()).hasSize(1);
        assertThat(session.players().get(0).playerId()).isEqualTo("player-1");
        assertThat(session.players().get(0).displayName()).isEqualTo("Thomas");
    }

    @Test
    void multiple_players_can_join_a_lobby_session() {
        Session session = Session.create("2026-05-29");

        session.join("player-1", "Thomas");
        session.join("player-2", "Anna");

        assertThat(session.players()).hasSize(2);
    }

    @Test
    void joining_an_active_session_throws() {
        Session session = Session.create("2026-05-29");
        session.start();

        assertThatThrownBy(() -> session.join("player-1", "Thomas")).isInstanceOf(CannotJoinSessionException.class);
    }

    @Test
    void joining_an_ended_session_throws() {
        Session session = Session.create("2026-05-29");
        session.start();
        session.end();

        assertThatThrownBy(() -> session.join("player-1", "Thomas")).isInstanceOf(CannotJoinSessionException.class);
    }
}
