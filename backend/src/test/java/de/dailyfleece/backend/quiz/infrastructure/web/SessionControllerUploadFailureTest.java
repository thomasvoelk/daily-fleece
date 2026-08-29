package de.dailyfleece.backend.quiz.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.TestcontainersConfiguration;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.web.multipart.MultipartFile;

/**
 * SessionController's createSessionByKey wraps checked IOExceptions from
 * MultipartFile#getInputStream() as IllegalStateException. Real MultipartFile implementations
 * backed by byte arrays never throw here, so this test uses a hand-written MultipartFile whose
 * getInputStream() throws, calling the controller method directly (no Mockito, no MockMvc, per
 * this repo's test conventions).
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SessionControllerUploadFailureTest {

    @Autowired
    SessionController controller;

    private static final class BrokenMultipartFile implements MultipartFile {

        @Override
        public String getName() {
            return "q1";
        }

        @Override
        public String getOriginalFilename() {
            return "q1.jpg";
        }

        @Override
        public String getContentType() {
            return "image/jpeg";
        }

        @Override
        public boolean isEmpty() {
            return false;
        }

        @Override
        public long getSize() {
            return 1;
        }

        @Override
        public byte[] getBytes() throws IOException {
            throw new IOException("broken stream");
        }

        @Override
        public InputStream getInputStream() throws IOException {
            throw new IOException("broken stream");
        }

        @Override
        public void transferTo(File dest) throws IOException {
            throw new IOException("broken stream");
        }

        @Override
        public void transferTo(Path dest) throws IOException {
            throw new IOException("broken stream");
        }
    }

    @Test
    void createSessionByKey_wraps_photo_read_ioexception_as_illegalStateException() {
        String today = LocalDate.now(ZoneId.systemDefault()).toString();
        BrokenMultipartFile brokenPhoto = new BrokenMultipartFile();

        assertThatThrownBy(() -> controller.createSessionByKey(
                        "default",
                        LocalDate.parse(today),
                        UUID.randomUUID().toString(),
                        "Host",
                        brokenPhoto,
                        brokenPhoto))
                .isInstanceOf(IllegalStateException.class)
                .hasCauseInstanceOf(IOException.class);
    }
}
