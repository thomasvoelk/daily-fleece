package de.dailyfleece.backend.quiz.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.shared.PlayerName;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SessionTest {

    private static final LocalDate DATE = LocalDate.parse("2026-05-29");
    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final PlayerName HOST_NAME = new PlayerName("Host");
    private static final UUID PLAYER_1 = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID PLAYER_2 = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    void new_session_starts_in_lobby_phase() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);

        assertThat(session.phase()).isEqualTo(SessionPhase.LOBBY);
    }

    @Test
    void create_adds_host_as_first_player() {
        Session session = Session.create(DATE, HOST_ID, new PlayerName("Thomas"));

        assertThat(session.players()).hasSize(1);
        assertThat(session.players().get(0).playerId()).isEqualTo(HOST_ID);
        assertThat(session.players().get(0).displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void player_can_join_a_lobby_session() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);

        session.join(PLAYER_1, new PlayerName("Thomas"));

        assertThat(session.players()).hasSize(2);
        assertThat(session.players().get(1).playerId()).isEqualTo(PLAYER_1);
        assertThat(session.players().get(1).displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void multiple_players_can_join_a_lobby_session() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);

        session.join(PLAYER_1, new PlayerName("Thomas"));
        session.join(PLAYER_2, new PlayerName("Anna"));

        assertThat(session.players()).hasSize(3);
    }

    @Test
    void joining_an_active_session_throws() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();

        assertThatThrownBy(() -> session.join(PLAYER_1, new PlayerName("Thomas")))
                .isInstanceOf(LobbyClosed.class);
    }

    @Test
    void joining_an_ended_session_throws() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();
        session.end();

        assertThatThrownBy(() -> session.join(PLAYER_1, new PlayerName("Thomas")))
                .isInstanceOf(LobbyClosed.class);
    }

    @Test
    void starting_an_active_session_throws() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();

        assertThatThrownBy(session::start).isInstanceOf(InvalidPhaseTransition.class);
    }

    @Test
    void starting_an_ended_session_throws() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();
        session.end();

        assertThatThrownBy(session::start).isInstanceOf(InvalidPhaseTransition.class);
    }

    @Test
    void start_transitions_lobby_session_to_active() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);

        session.start();

        assertThat(session.phase()).isEqualTo(SessionPhase.ACTIVE);
    }

    @Test
    void start_opens_q1_voting() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);

        session.start();

        assertThat(session.q1Voting()).isPresent();
        assertThat(session.q1Voting().get().status()).isEqualTo(VotingStatus.OPEN);
    }

    @Test
    void player_can_submit_answer_for_open_q1_voting() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();

        session.submitAnswer(QuestionKey.Q1, PLAYER_1, "A");

        assertThat(session.q1Voting().get().answers()).containsEntry(PLAYER_1.toString(), "A");
    }

    @Test
    void player_can_change_answer_while_voting_is_open() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();
        session.submitAnswer(QuestionKey.Q1, PLAYER_1, "A");

        session.submitAnswer(QuestionKey.Q1, PLAYER_1, "B");

        assertThat(session.q1Voting().get().answers()).containsEntry(PLAYER_1.toString(), "B");
    }

    @Test
    void submitting_answer_to_closed_voting_throws() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();
        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "A");

        assertThatThrownBy(() -> session.submitAnswer(QuestionKey.Q1, PLAYER_1, "B"))
                .isInstanceOf(VotingClosed.class);
    }

    @Test
    void setCorrectAnswer_on_q1_closes_q1_and_opens_q2() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();

        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "B");

        assertThat(session.q1Voting().get().status()).isEqualTo(VotingStatus.CLOSED);
        assertThat(session.q1Voting().get().correctAnswer()).isEqualTo("B");
        assertThat(session.q2Voting()).isPresent();
        assertThat(session.q2Voting().get().status()).isEqualTo(VotingStatus.OPEN);
        assertThat(session.phase()).isEqualTo(SessionPhase.ACTIVE);
    }

    @Test
    void setCorrectAnswer_on_q2_closes_q2_and_ends_session() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();
        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "A");

        session.setCorrectAnswer(QuestionKey.Q2, HOST_ID, "DE");

        assertThat(session.q2Voting().get().status()).isEqualTo(VotingStatus.CLOSED);
        assertThat(session.q2Voting().get().correctAnswer()).isEqualTo("DE");
        assertThat(session.phase()).isEqualTo(SessionPhase.ENDED);
    }

    @Test
    void results_player_who_answered_both_correctly_gets_2_points() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();
        session.submitAnswer(QuestionKey.Q1, HOST_ID, "B");
        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "B");
        session.submitAnswer(QuestionKey.Q2, HOST_ID, "DE");
        session.setCorrectAnswer(QuestionKey.Q2, HOST_ID, "DE");

        List<PlayerResult> results = session.results();

        assertThat(results).hasSize(1);
        assertThat(results.get(0).playerId()).isEqualTo(HOST_ID);
        assertThat(results.get(0).displayName()).isEqualTo(HOST_NAME);
        assertThat(results.get(0).q1Correct()).isTrue();
        assertThat(results.get(0).q2Correct()).isTrue();
        assertThat(results.get(0).totalPoints()).isEqualTo(2);
    }

    @Test
    void results_player_who_did_not_answer_gets_0_points() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.join(PLAYER_1, new PlayerName("Anna"));
        session.start();
        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "B");
        session.setCorrectAnswer(QuestionKey.Q2, HOST_ID, "DE");

        List<PlayerResult> results = session.results();

        PlayerResult anna = results.stream()
                .filter(r -> r.playerId().equals(PLAYER_1))
                .findFirst()
                .orElseThrow();
        assertThat(anna.q1Correct()).isFalse();
        assertThat(anna.q2Correct()).isFalse();
        assertThat(anna.totalPoints()).isEqualTo(0);
    }

    @Test
    void results_player_with_correct_q1_and_wrong_q2_gets_1_point() {
        Session session = Session.create(DATE, HOST_ID, HOST_NAME);
        session.start();
        session.submitAnswer(QuestionKey.Q1, HOST_ID, "B");
        session.setCorrectAnswer(QuestionKey.Q1, HOST_ID, "B");
        session.submitAnswer(QuestionKey.Q2, HOST_ID, "FR");
        session.setCorrectAnswer(QuestionKey.Q2, HOST_ID, "DE");

        List<PlayerResult> results = session.results();

        assertThat(results.get(0).q1Correct()).isTrue();
        assertThat(results.get(0).q2Correct()).isFalse();
        assertThat(results.get(0).totalPoints()).isEqualTo(1);
    }
}
