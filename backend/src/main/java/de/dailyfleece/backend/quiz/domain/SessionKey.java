package de.dailyfleece.backend.quiz.domain;

import java.time.LocalDate;
import org.springframework.util.Assert;

/** Natural key of a {@link Session}: the combination of project and date that uniquely identifies it. */
public record SessionKey(ProjectId projectId, LocalDate date) {
    public SessionKey {
        Assert.notNull(projectId, "projectId must not be null");
        Assert.notNull(date, "date must not be null");
    }
}
