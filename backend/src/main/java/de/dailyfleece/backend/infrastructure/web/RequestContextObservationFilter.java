package de.dailyfleece.backend.infrastructure.web;

import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.http.server.observation.ServerRequestObservationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerMapping;

/**
 * Attaches session natural-key attributes (session.project_id, session.date) to every HTTP
 * observation, read from the request's path variables (sessions are natural-key-routed, see
 * ADR-0016). Runs on every {@link Observation} in the registry; no-ops for non-HTTP observations
 * and HTTP requests without those path variables.
 */
@Component
class RequestContextObservationFilter implements ObservationFilter {

    private static final String PROJECT_ID_PATH_VARIABLE = "projectId";
    private static final String DATE_PATH_VARIABLE = "date";

    @Override
    public Observation.Context map(Observation.Context context) {
        if (context instanceof ServerRequestObservationContext httpContext) {
            HttpServletRequest request = Objects.requireNonNull(httpContext.getCarrier());
            pathVariable(request, PROJECT_ID_PATH_VARIABLE)
                    .ifPresent(v -> context.addLowCardinalityKeyValue(KeyValue.of("session.project_id", v)));
            pathVariable(request, DATE_PATH_VARIABLE)
                    .ifPresent(v -> context.addHighCardinalityKeyValue(KeyValue.of("session.date", v)));
        }
        return context;
    }

    private static Optional<String> pathVariable(HttpServletRequest request, String name) {
        return Optional.ofNullable(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE))
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .map(vars -> vars.get(name))
                .map(Object::toString);
    }
}
