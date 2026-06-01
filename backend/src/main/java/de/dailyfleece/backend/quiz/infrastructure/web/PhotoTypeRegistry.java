package de.dailyfleece.backend.quiz.infrastructure.web;

import de.dailyfleece.backend.quiz.domain.PhotoType;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.http.MediaType;

final class PhotoTypeRegistry {

    private record Mapping(PhotoType enumType, MediaType mediaType) {}

    private static final List<Mapping> REGISTRY = List.of(
            new Mapping(PhotoType.JPEG, MediaType.IMAGE_JPEG),
            new Mapping(PhotoType.PNG, MediaType.IMAGE_PNG),
            new Mapping(PhotoType.WEBP, MediaType.parseMediaType("image/webp")));

    private static final Map<String, PhotoType> MIME_TO_ENUM = REGISTRY.stream()
            .collect(Collectors.toUnmodifiableMap(m -> m.mediaType().toString(), Mapping::enumType));

    private static final Map<PhotoType, MediaType> ENUM_TO_MEDIA_TYPE =
            REGISTRY.stream().collect(Collectors.toUnmodifiableMap(Mapping::enumType, Mapping::mediaType));

    private PhotoTypeRegistry() {}

    static PhotoType toEnum(@Nullable String mimeType) {
        PhotoType type = mimeType != null ? MIME_TO_ENUM.get(mimeType) : null;
        if (type == null) {
            throw new IllegalArgumentException("Unsupported image type: " + mimeType);
        }
        return type;
    }

    static MediaType toMediaType(PhotoType type) {
        return Objects.requireNonNull(ENUM_TO_MEDIA_TYPE.get(type), () -> "No MediaType registered for: " + type);
    }
}
