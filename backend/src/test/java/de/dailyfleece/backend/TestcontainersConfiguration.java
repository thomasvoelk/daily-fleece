package de.dailyfleece.backend;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.mongodb.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    MongoDBContainer mongoDbContainer() {
        return new MongoDBContainer(DockerImageName.parse("mongo:8.2"))
                .waitingFor(Wait.forLogMessage("(?i).*waiting for connections.*", 1)
                        .withStartupTimeout(Duration.ofSeconds(60)));
    }

    @Bean
    ApplicationRunner schemaSetup(MongoDBContainer container) {
        return args -> {
            for (var script : List.of("V1__init_players.js", "V2__init_sessions.js")) {
                container.copyFileToContainer(
                        MountableFile.forClasspathResource("db/migration/" + script), "/tmp/" + script);
                var result = container.execInContainer(
                        "mongosh", "mongodb://localhost:27017/test", "--file", "/tmp/" + script, "--quiet");
                if (result.getExitCode() != 0)
                    throw new IllegalStateException("Migration failed: " + script + "\n" + result.getStderr());
            }
        };
    }
}
