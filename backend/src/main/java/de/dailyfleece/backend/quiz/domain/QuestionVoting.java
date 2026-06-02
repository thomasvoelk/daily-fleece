package de.dailyfleece.backend.quiz.domain;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.jspecify.annotations.Nullable;

/** Tracks voting for one question: status, each player's answer, and the correct answer once declared. */
public final class QuestionVoting {

    private VotingStatus status;
    private final Map<String, String> answers;

    @Nullable
    private String correctAnswer;

    private QuestionVoting(VotingStatus status, Map<String, String> answers, @Nullable String correctAnswer) {
        this.status = status;
        this.answers = new HashMap<>(answers);
        this.correctAnswer = correctAnswer;
    }

    public static QuestionVoting open() {
        return new QuestionVoting(VotingStatus.OPEN, Map.of(), null);
    }

    public static QuestionVoting reconstitute(
            VotingStatus status, Map<String, String> answers, @Nullable String correctAnswer) {
        return new QuestionVoting(status, answers, correctAnswer);
    }

    public void submitAnswer(String playerId, String answer) {
        answers.put(playerId, answer);
    }

    public void close(@Nullable String correctAnswer) {
        this.status = VotingStatus.CLOSED;
        this.correctAnswer = correctAnswer;
    }

    public VotingStatus status() {
        return status;
    }

    public Map<String, String> answers() {
        return Collections.unmodifiableMap(answers);
    }

    public @Nullable String correctAnswer() {
        return correctAnswer;
    }
}
