package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.DisplayName;
import de.dailyfleece.backend.quiz.domain.CannotJoinSessionException;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class JoinSessionUseCaseTest {

    private static final UUID PLAYER_1 = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Autowired
    private JoinSessionUseCase useCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Test
    void join_adds_player_to_lobby_session() {
        LocalDate date = LocalDate.of(2098, 1, 1);
        sessionRepository.save(Session.create(date));

        useCase.join(date, PLAYER_1, new DisplayName("Thomas"));

        Session updated = sessionRepository.findByDate(date).orElseThrow();
        assertThat(updated.players()).hasSize(1);
        assertThat(updated.players().get(0).displayName()).isEqualTo(new DisplayName("Thomas"));
    }

    @Test
    void join_throws_when_no_session_exists_for_date() {
        assertThatThrownBy(() -> useCase.join(LocalDate.of(2098, 1, 2), PLAYER_1, new DisplayName("Thomas")))
                .isInstanceOf(NoSessionForDateException.class);
    }

    @Test
    void join_propagates_domain_exception_when_session_not_in_lobby() {
        LocalDate date = LocalDate.of(2098, 1, 3);
        Session session = Session.create(date);
        session.start();
        sessionRepository.save(session);

        assertThatThrownBy(() -> useCase.join(date, PLAYER_1, new DisplayName("Thomas")))
                .isInstanceOf(CannotJoinSessionException.class);
    }
}
