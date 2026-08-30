package de.dailyfleece.backend.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.common.KeyValue;
import io.micrometer.observation.Observation;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.server.observation.ServerRequestObservationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

class RequestContextObservationFilterTest {

    private final RequestContextObservationFilter filter = new RequestContextObservationFilter();

    @Test
    void attaches_project_id_and_date_from_resolved_path_variables() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(
                HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, Map.of("projectId", "default", "date", "2026-06-10"));
        ServerRequestObservationContext context =
                new ServerRequestObservationContext(request, new MockHttpServletResponse());

        Observation.Context result = filter.map(context);

        assertThat(result.getLowCardinalityKeyValue("session.project_id"))
                .isNotNull()
                .extracting(KeyValue::getValue)
                .isEqualTo("default");
        assertThat(result.getHighCardinalityKeyValue("session.date"))
                .isNotNull()
                .extracting(KeyValue::getValue)
                .isEqualTo("2026-06-10");
    }

    @Test
    void no_ops_when_request_has_no_resolved_path_variables() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        ServerRequestObservationContext context =
                new ServerRequestObservationContext(request, new MockHttpServletResponse());

        Observation.Context result = filter.map(context);

        assertThat(result.getLowCardinalityKeyValue("session.project_id")).isNull();
        assertThat(result.getHighCardinalityKeyValue("session.date")).isNull();
    }

    @Test
    void no_ops_for_non_http_observations() {
        Observation.Context context = new Observation.Context();

        Observation.Context result = filter.map(context);

        assertThat(result).isSameAs(context);
        assertThat(result.getLowCardinalityKeyValue("session.project_id")).isNull();
    }
}
