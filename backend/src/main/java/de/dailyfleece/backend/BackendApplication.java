package de.dailyfleece.backend;

import de.dailyfleece.backend.infrastructure.Generated;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

@Modulithic(sharedModules = "infrastructure")
@SpringBootApplication
public class BackendApplication {

    // Tests use the Spring TestContext framework to load the application context, never this CLI
    // entrypoint, so this line is never exercised (see df-0b86.5).
    @Generated
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
