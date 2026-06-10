package de.dailyfleece.backend.quiz.domain;

import org.springframework.util.Assert;

/** Identifies a project; used as part of the natural key for a {@link Session}. */
public record ProjectId(String value) {
    public ProjectId {
        Assert.hasText(value, "ProjectId must not be blank");
    }
}
