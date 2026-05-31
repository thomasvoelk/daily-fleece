package de.dailyfleece.backend.quiz.domain;

import java.io.InputStream;
import org.springframework.util.MimeType;

public record Photo(InputStream data, MimeType mimeType) {}
