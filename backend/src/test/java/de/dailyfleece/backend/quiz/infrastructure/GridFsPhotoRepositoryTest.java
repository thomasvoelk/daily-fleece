package de.dailyfleece.backend.quiz.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.modulith.test.ApplicationModuleTest;
import org.springframework.util.MimeType;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class GridFsPhotoRepositoryTest {

    private static final UUID SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER_SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final MimeType IMAGE_JPEG = MimeType.valueOf("image/jpeg");

    @Autowired
    PhotoRepository photoRepository;

    @Test
    void store_and_load_roundtrip() throws IOException {
        byte[] original = "fake-image-bytes".getBytes(StandardCharsets.UTF_8);
        photoRepository.store(new Photo(SESSION_ID, "q1", new ByteArrayInputStream(original), IMAGE_JPEG));

        var photo = photoRepository.load(SESSION_ID, "q1").orElseThrow();

        assertThat(photo.data().readAllBytes()).isEqualTo(original);
        assertThat(photo.mimeType()).isEqualTo(IMAGE_JPEG);
    }

    @Test
    void load_returns_empty_when_not_found() {
        assertThat(photoRepository.load(OTHER_SESSION_ID, "q1")).isEmpty();
    }
}
