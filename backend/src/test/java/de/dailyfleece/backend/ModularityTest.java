package de.dailyfleece.backend;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTest {

    @Test
    void verifyModularity() {
        ApplicationModules.of(BackendApplication.class).verify();
    }
}
