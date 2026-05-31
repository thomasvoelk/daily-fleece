package de.dailyfleece.backend.quiz.domain;

import java.util.regex.Pattern;

/** A GridFS ObjectId stored as a 24-character lowercase hex string. */
public record PhotoId(String value) {

    private static final Pattern HEX_24 = Pattern.compile("[0-9a-f]{24}");

    public PhotoId {
        if (value == null || !HEX_24.matcher(value).matches()) {
            throw new IllegalArgumentException("PhotoId must be a 24-character lowercase hex string, got: " + value);
        }
    }
}
