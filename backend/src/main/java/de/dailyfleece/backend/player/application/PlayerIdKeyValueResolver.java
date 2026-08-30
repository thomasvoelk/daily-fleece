package de.dailyfleece.backend.player.application;

import de.dailyfleece.backend.player.domain.Player;
import io.micrometer.common.annotation.ValueResolver;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

/**
 * Resolves {@code player.id} from a {@link Player} method result for the {@code
 * ObservationKeyValue} annotation. A plain SpEL expression would throw when the annotated method
 * exits via an exception (result is {@code null}); Micrometer's ObservedAspect evaluates result
 * annotations unconditionally, so this resolver must tolerate that case instead of letting the
 * exception surface as noisy logging.
 */
@Component
class PlayerIdKeyValueResolver implements ValueResolver {

    @Override
    public String resolve(@Nullable Object parameter) {
        return parameter instanceof Player player ? player.playerId().toString() : "";
    }
}
