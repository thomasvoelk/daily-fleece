package de.dailyfleece.backend.quiz.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.dailyfleece.backend.quiz.domain.PhotoType;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class PhotoTypeRegistryTest {

    @Test
    void toEnum_rejects_null_mimeType() {
        assertThatThrownBy(() -> PhotoTypeRegistry.toEnum(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void toEnum_rejects_unknown_mimeType() {
        assertThatThrownBy(() -> PhotoTypeRegistry.toEnum("application/bogus"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void toEnum_resolves_known_mimeType() {
        assertThat(PhotoTypeRegistry.toEnum(MediaType.IMAGE_JPEG.toString())).isEqualTo(PhotoType.JPEG);
    }

    @Test
    void toMediaType_resolves_each_photoType() {
        assertThat(PhotoTypeRegistry.toMediaType(PhotoType.JPEG)).isEqualTo(MediaType.IMAGE_JPEG);
        assertThat(PhotoTypeRegistry.toMediaType(PhotoType.PNG)).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(PhotoTypeRegistry.toMediaType(PhotoType.WEBP)).isEqualTo(MediaType.parseMediaType("image/webp"));
    }
}
