package de.dailyfleece.backend.quiz.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class QuestionVotingTest {

    @Test
    void visibleAnswers_is_empty_while_voting_is_open() {
        var voting = QuestionVoting.open();
        voting.submitAnswer("player-1", "A");

        assertThat(voting.visibleAnswers()).isEmpty();
    }

    @Test
    void visibleAnswers_returns_answers_after_close() {
        var voting = QuestionVoting.open();
        voting.submitAnswer("player-1", "A");
        voting.submitAnswer("player-2", "B");
        voting.close("A");

        assertThat(voting.visibleAnswers()).hasValueSatisfying(answers -> {
            assertThat(answers).containsEntry("player-1", "A").containsEntry("player-2", "B");
        });
    }

    @Test
    void visibleCorrectAnswer_is_empty_while_voting_is_open() {
        var voting = QuestionVoting.open();

        assertThat(voting.visibleCorrectAnswer()).isEmpty();
    }

    @Test
    void visibleCorrectAnswer_returns_correct_answer_after_close() {
        var voting = QuestionVoting.open();
        voting.close("C");

        assertThat(voting.visibleCorrectAnswer()).hasValue("C");
    }
}
