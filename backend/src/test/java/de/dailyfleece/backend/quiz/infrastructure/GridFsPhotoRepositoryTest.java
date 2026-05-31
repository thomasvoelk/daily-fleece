package de.dailyfleece.backend.quiz.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.quiz.domain.PhotoId;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.modulith.test.ApplicationModuleTest;
import org.springframework.util.MimeType;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class GridFsPhotoRepositoryTest {

    private static final UUID SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final MimeType IMAGE_JPEG = MimeType.valueOf("image/jpeg");

    @Autowired
    PhotoRepository photoRepository;

    @Autowired
    GridFsOperations operations;

    @Test
    void store_returns_valid_photo_id() {
        var data = new ByteArrayInputStream("fake-image-bytes".getBytes(StandardCharsets.UTF_8));

        PhotoId photoId = photoRepository.store(data, IMAGE_JPEG, SESSION_ID, "q1");

        assertThat(photoId).isNotNull();
    }

    @Test
    void load_returns_stored_bytes() throws IOException {
        byte[] original = "fake-image-bytes".getBytes(StandardCharsets.UTF_8);
        PhotoId photoId = photoRepository.store(new ByteArrayInputStream(original), IMAGE_JPEG, SESSION_ID, "q1");

        var photo = photoRepository.load(photoId).orElseThrow();

        assertThat(photo.data().readAllBytes()).isEqualTo(original);
        assertThat(photo.mimeType()).isEqualTo(IMAGE_JPEG);
    }

    @Test
    void store_persists_session_and_question_in_metadata() {
        var data = new ByteArrayInputStream("fake-image-bytes".getBytes(StandardCharsets.UTF_8));

        PhotoId photoId = photoRepository.store(data, IMAGE_JPEG, SESSION_ID, "q1");

        var file = operations.findOne(
                Query.query(Criteria.where("metadata.photoId").is(photoId.value())));
        var nonNullFile = Objects.requireNonNull(file);
        var metadata = Objects.requireNonNull(nonNullFile.getMetadata());
        assertThat(metadata.getString("sessionId")).isEqualTo(SESSION_ID.toString());
        assertThat(metadata.getString("question")).isEqualTo("q1");
    }
}
