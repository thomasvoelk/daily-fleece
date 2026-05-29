package de.dailyfleece.backend;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.library.Architectures.onionArchitecture;

@AnalyzeClasses(packages = "de.dailyfleece.backend")
class ArchitectureTest {

    @ArchTest
    static final ArchRule onionArchitecture = onionArchitecture()
            .domainModels("..domain..")
            .applicationServices("..application..")
            .adapter("web", "..infrastructure.web..")
            .adapter("persistence", "..infrastructure.persistence..")
            .withOptionalLayers(true);
}
