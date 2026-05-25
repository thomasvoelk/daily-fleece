package com.dailyfleece;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTest {

    static final ApplicationModules modules = ApplicationModules.of(DailyFleeceBackendApplication.class);

    @Test
    void verifiesModularStructure() {
        modules.verify();
    }
}
