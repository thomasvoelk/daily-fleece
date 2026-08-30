package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import io.micrometer.common.annotation.ValueResolver;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

/**
 * Resolves {@code session.phase} from a {@link Session} method result for the {@code
 * ObservationKeyValue} annotation. See {@link SessionIdKeyValueResolver} for why a resolver is
 * used instead of a SpEL expression here.
 */
@Component
class SessionPhaseKeyValueResolver implements ValueResolver {

    @Override
    public String resolve(@Nullable Object parameter) {
        return parameter instanceof Session session ? session.phase().name() : "";
    }
}
