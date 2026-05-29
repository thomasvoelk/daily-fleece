package de.dailyfleece.backend.player.api;

public record CompanyId(String value) {
    public CompanyId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("CompanyId must not be blank");
        }
    }
}
