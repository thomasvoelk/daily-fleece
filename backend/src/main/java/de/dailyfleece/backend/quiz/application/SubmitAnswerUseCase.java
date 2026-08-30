package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.QuestionKey;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.micrometer.observation.annotation.ObservationKeyValue;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.observation.aop.Cardinality;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Records a player's answer for the given question, overwriting any previous answer. */
@Service
public class SubmitAnswerUseCase {

    private final SessionRepository sessionRepository;

    @SuppressFBWarnings("EI_EXPOSE_REP2")
    public SubmitAnswerUseCase(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /** Records {@code answer} for {@code playerId} on {@code question}, overwriting any prior answer. */
    @Observed
    public void submit(
            @ObservationKeyValue(key = "session.id", cardinality = Cardinality.HIGH) UUID sessionId,
            @ObservationKeyValue(key = "voting.question", cardinality = Cardinality.LOW) QuestionKey question,
            @ObservationKeyValue(key = "player.id", cardinality = Cardinality.HIGH) UUID playerId,
            String answer) {
        Session session = sessionRepository.findById(sessionId).orElseThrow(() -> new SessionNotFound(sessionId));
        session.submitAnswer(question, playerId, answer);
        sessionRepository.save(session);
    }
}
