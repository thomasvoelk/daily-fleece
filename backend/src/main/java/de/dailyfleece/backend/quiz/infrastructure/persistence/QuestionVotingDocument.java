package de.dailyfleece.backend.quiz.infrastructure.persistence;

import de.dailyfleece.backend.quiz.domain.QuestionVoting;
import de.dailyfleece.backend.quiz.domain.VotingStatus;
import java.util.Map;
import org.jspecify.annotations.Nullable;

/** Embedded document storing the voting state for one question. */
record QuestionVotingDocument(
        String status,
        Map<String, String> answers,
        @Nullable String correctAnswer) {

    static QuestionVotingDocument fromDomain(QuestionVoting voting) {
        return new QuestionVotingDocument(voting.status().name(), voting.answers(), voting.correctAnswer());
    }

    QuestionVoting toDomain() {
        return QuestionVoting.reconstitute(VotingStatus.valueOf(status), answers, correctAnswer);
    }
}
