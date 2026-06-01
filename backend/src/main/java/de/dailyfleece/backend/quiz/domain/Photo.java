package de.dailyfleece.backend.quiz.domain;

import java.io.InputStream;
import java.util.UUID;
import org.springframework.util.MimeType;

/** A host-supplied photo associated with a session question. */
public record Photo(UUID sessionId, String question, InputStream data, MimeType mimeType) {

    public String filename() {
        return filenameFor(sessionId, question);
    }

    public static String filenameFor(UUID sessionId, String question) {
        return sessionId + "_" + question;
    }
}
