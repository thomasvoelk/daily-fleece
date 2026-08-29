package de.dailyfleece.backend.quiz.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.quiz.domain.Photo;
import de.dailyfleece.backend.quiz.domain.PhotoRepository;
import de.dailyfleece.backend.quiz.domain.PhotoType;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class GridFsPhotoRepositoryTest {

    private static final UUID SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OTHER_SESSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Autowired
    PhotoRepository photoRepository;

    @Autowired
    GridFsOperations gridFsOperations;

    @Test
    void store_and_load_roundtrip() throws IOException {
        byte[] original = "fake-image-bytes".getBytes(StandardCharsets.UTF_8);
        photoRepository.store(new Photo(SESSION_ID, "q1", new ByteArrayInputStream(original), PhotoType.JPEG));

        var photo = photoRepository.load(SESSION_ID, "q1").orElseThrow();

        assertThat(photo.data().readAllBytes()).isEqualTo(original);
        assertThat(photo.photoType()).isEqualTo(PhotoType.JPEG);
    }

    @Test
    void load_returns_empty_when_not_found() {
        assertThat(photoRepository.load(OTHER_SESSION_ID, "q1")).isEmpty();
    }

    @Test
    void load_throws_when_gridfs_file_has_no_metadata() {
        UUID sessionId = UUID.fromString("00000000-0000-0000-0000-000000000003");
        String filename = Photo.filenameFor(sessionId, "q1");
        // Bypass PhotoRepository#store (which always attaches _photoType metadata) to create a
        // GridFS file with no metadata document, reproducing a state this class's own writes
        // cannot produce.
        gridFsOperations.store(
                new ByteArrayInputStream("data".getBytes(StandardCharsets.UTF_8)), filename, null, (Object) null);

        assertThatThrownBy(() -> photoRepository.load(sessionId, "q1")).isInstanceOf(IllegalStateException.class);
    }
}
