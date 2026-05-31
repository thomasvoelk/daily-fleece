package de.dailyfleece.backend.quiz.domain;

/** Groups the two photo IDs (one per quiz question) that belong to a Session. */
public record SessionPhotos(String q1PhotoId, String q2PhotoId) {}
