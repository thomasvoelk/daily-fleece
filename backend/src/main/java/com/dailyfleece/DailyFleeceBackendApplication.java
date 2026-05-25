package com.dailyfleece;

import org.jspecify.annotations.NullMarked;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@NullMarked
@SpringBootApplication
public class DailyFleeceBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(DailyFleeceBackendApplication.class, args);
	}

}
