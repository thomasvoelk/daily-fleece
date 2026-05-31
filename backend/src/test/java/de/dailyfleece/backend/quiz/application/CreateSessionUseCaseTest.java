package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.modulith.test.ApplicationModuleTest;
import org.springframework.util.MimeType;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class CreateSessionUseCaseTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final PlayerName HOST_NAME = new PlayerName("Host");
    private static final MimeType IMAGE_JPEG = MimeType.valueOf("image/jpeg");

    @Autowired
    private CreateSessionUseCase useCase;

    @Autowired
    private SessionRepository sessionRepository;

    @Test
    void create_stores_photos_and_persists_session() {
        LocalDate date = LocalDate.parse("2097-01-01");
        var q1 = new ByteArrayInputStream("photo1".getBytes(StandardCharsets.UTF_8));
        var q2 = new ByteArrayInputStream("photo2".getBytes(StandardCharsets.UTF_8));

        Session session = useCase.create(date, HOST_ID, HOST_NAME, q1, IMAGE_JPEG, q2, IMAGE_JPEG);

        assertThat(session.date()).isEqualTo(date);
        assertThat(session.hostId()).isEqualTo(HOST_ID);
        assertThat(session.players()).hasSize(1);
        assertThat(session.players().get(0).displayName()).isEqualTo(HOST_NAME);
        assertThat(sessionRepository.findByDate(date)).isPresent();
    }

    @Test
    void create_throws_when_session_already_exists_for_date() {
        LocalDate date = LocalDate.parse("2097-01-02");
        var q1 = new ByteArrayInputStream("photo1".getBytes(StandardCharsets.UTF_8));
        var q2 = new ByteArrayInputStream("photo2".getBytes(StandardCharsets.UTF_8));
        useCase.create(date, HOST_ID, HOST_NAME, q1, IMAGE_JPEG, q2, IMAGE_JPEG);

        var q1b = new ByteArrayInputStream("photo1".getBytes(StandardCharsets.UTF_8));
        var q2b = new ByteArrayInputStream("photo2".getBytes(StandardCharsets.UTF_8));
        assertThatThrownBy(() -> useCase.create(date, HOST_ID, HOST_NAME, q1b, IMAGE_JPEG, q2b, IMAGE_JPEG))
                .isInstanceOf(SessionAlreadyExists.class);
    }
}
