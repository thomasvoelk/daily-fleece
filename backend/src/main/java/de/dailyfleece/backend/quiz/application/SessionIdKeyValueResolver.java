package de.dailyfleece.backend.quiz.application;

import de.dailyfleece.backend.quiz.domain.Session;
import io.micrometer.common.annotation.ValueResolver;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

/**
 * Resolves {@code session.id} from a {@link Session} method result for {@code @ObservationKeyValue}.
 * A plain SpEL {@code expression} would throw when the annotated method exits via an exception
 * (result is {@code null}); Micrometer's ObservedAspect evaluates result annotations unconditionally,
 * so this resolver must tolerate that case instead of letting the exception surface as noisy logging.
 */
@Component
class SessionIdKeyValueResolver implements ValueResolver {

    @Override
    public String resolve(@Nullable Object parameter) {
        return parameter instanceof Session session ? session.sessionId().toString() : "";
    }
}
