package de.dailyfleece.backend.quiz.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.player.api.PlayerName;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SessionTest {

    private static final LocalDate DATE = LocalDate.of(2026, 5, 29);
    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final PlayerName HOST_NAME = new PlayerName("Host");
    private static final UUID PLAYER_1 = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID PLAYER_2 = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final SessionPhotos PHOTOS =
            new SessionPhotos("aaaaaaaaaaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbbbbbbbbbb");

    @Test
    void new_session_starts_in_lobby_phase() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME, PHOTOS);

        assertThat(session.phase()).isEqualTo(SessionPhase.LOBBY);
    }

    @Test
    void create_adds_host_as_first_player() {
        Session session = Session.create(DATE, HOST_ID, new PlayerName("Thomas"), PHOTOS);

        assertThat(session.players()).hasSize(1);
        assertThat(session.players().get(0).playerId()).isEqualTo(HOST_ID);
        assertThat(session.players().get(0).displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void player_can_join_a_lobby_session() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME, PHOTOS);

        session.join(PLAYER_1, new PlayerName("Thomas"));

        assertThat(session.players()).hasSize(2);
        assertThat(session.players().get(1).playerId()).isEqualTo(PLAYER_1);
        assertThat(session.players().get(1).displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void multiple_players_can_join_a_lobby_session() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME, PHOTOS);

        session.join(PLAYER_1, new PlayerName("Thomas"));
        session.join(PLAYER_2, new PlayerName("Anna"));

        assertThat(session.players()).hasSize(3);
    }

    @Test
    void joining_an_active_session_throws() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME, PHOTOS);
        session.start();

        assertThatThrownBy(() -> session.join(PLAYER_1, new PlayerName("Thomas")))
                .isInstanceOf(LobbyClosed.class);
    }

    @Test
    void joining_an_ended_session_throws() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME, PHOTOS);
        session.start();
        session.end();

        assertThatThrownBy(() -> session.join(PLAYER_1, new PlayerName("Thomas")))
                .isInstanceOf(LobbyClosed.class);
    }
}
