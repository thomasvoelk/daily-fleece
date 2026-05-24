# Two separate Cloud Foundry applications

The Angular frontend and the Spring Boot backend are deployed as two independent CF applications. The Angular app is served via the nginx buildpack; the Spring Boot app runs as a standard Java buildpack app.

The alternative — bundling the Angular build output into `src/main/resources/static` and shipping a single JAR — was rejected because it merges the deployment lifecycles of frontend and backend, making it impossible to deploy one without the other. Two CF apps also match the clean separation enforced by the OpenAPI contract (ADR-0003).
