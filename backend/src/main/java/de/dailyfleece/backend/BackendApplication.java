package de.dailyfleece.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

@Modulithic(sharedModules = "infrastructure")
@SpringBootApplication
public class BackendApplication {

    // Tests use the Spring TestContext framework to load the application context, never this CLI
    // entrypoint, so this line is never exercised (see df-0b86.5). Re-checked (see df-0b86.6):
    // SpringBootContextLoader bootstraps via its own `new SpringApplication()` instance rather than
    // calling this method or even the static SpringApplication.run(Class, String...) overload it
    // uses, so no @SpringBootTest/@ApplicationModuleTest run ever reaches this line -- there's no
    // feasible test for it, only a build-config exclusion (see this class's jacoco exclude in
    // pom.xml), consistent with the common practice of excluding Spring Boot's main() from coverage
    // gates.
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
