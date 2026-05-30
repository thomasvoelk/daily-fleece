package de.dailyfleece.backend;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.library.Architectures.onionArchitecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packages = "de.dailyfleece.backend", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule onionArchitecture = onionArchitecture()
            .domainModels("..domain..", "..api..")
            .applicationServices("..application..")
            .adapter("web", "..infrastructure.web..")
            .adapter("persistence", "..infrastructure.persistence..")
            .withOptionalLayers(true);

    @ArchTest
    static final ArchRule noExceptionSuffix = classes()
            .that()
            .areAssignableTo(Throwable.class)
            .should()
            .haveSimpleNameNotEndingWith("Exception")
            .because("exception class names should not redundantly end in 'Exception'");
}
