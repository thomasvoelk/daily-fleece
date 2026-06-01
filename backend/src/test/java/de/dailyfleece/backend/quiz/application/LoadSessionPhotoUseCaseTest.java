package de.dailyfleece.backend.quiz.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoType;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class LoadSessionPhotoUseCaseTest {

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final PlayerName HOST_NAME = new PlayerName("Host");
    private static final byte[] Q1_BYTES = "q1-data".getBytes(StandardCharsets.UTF_8);
    private static final byte[] Q2_BYTES = "q2-data".getBytes(StandardCharsets.UTF_8);

    @Autowired
    CreateSessionUseCase createSessionUseCase;

    @Autowired
    LoadSessionPhotoUseCase loadSessionPhotoUseCase;

    @Test
    void load_returns_q1_photo_bytes() throws IOException {
        var session = createSessionUseCase.create(
                LocalDate.parse("2097-02-01"),
                HOST_ID,
                HOST_NAME,
                new ByteArrayInputStream(Q1_BYTES),
                PhotoType.JPEG,
                new ByteArrayInputStream(Q2_BYTES),
                PhotoType.JPEG);

        Photo photo = loadSessionPhotoUseCase.load(session.sessionId(), "q1");

        assertThat(photo.data().readAllBytes()).isEqualTo(Q1_BYTES);
        assertThat(photo.photoType()).isEqualTo(PhotoType.JPEG);
    }

    @Test
    void load_returns_q2_photo_bytes() throws IOException {
        var session = createSessionUseCase.create(
                LocalDate.parse("2097-02-02"),
                HOST_ID,
                HOST_NAME,
                new ByteArrayInputStream(Q1_BYTES),
                PhotoType.JPEG,
                new ByteArrayInputStream(Q2_BYTES),
                PhotoType.JPEG);

        Photo photo = loadSessionPhotoUseCase.load(session.sessionId(), "q2");

        assertThat(photo.data().readAllBytes()).isEqualTo(Q2_BYTES);
    }

    @Test
    void load_throws_when_session_not_found() {
        UUID unknownId = UUID.randomUUID();

        assertThatThrownBy(() -> loadSessionPhotoUseCase.load(unknownId, "q1")).isInstanceOf(SessionNotFound.class);
    }
}
