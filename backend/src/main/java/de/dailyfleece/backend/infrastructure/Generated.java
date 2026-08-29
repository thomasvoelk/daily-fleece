package de.dailyfleece.backend.infrastructure;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a method or class as excluded from the jacoco coverage gate. JaCoCo's built-in generated-code
 * filter recognizes any annotation named exactly {@code Generated} with class-retention, regardless of
 * package -- this lets a single unreachable branch be excluded without exempting the rest of its
 * enclosing class, unlike a pom.xml class-pattern exclude.
 */
@Retention(RetentionPolicy.CLASS)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface Generated {}
