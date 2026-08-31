package com.drip.marketplace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// EnableScheduling activa el soporte de tareas programadas (@Scheduled)
// en toda la app, sin esto los metodos con @Scheduled nunca se ejecutarian
@SpringBootApplication
@EnableScheduling
public class MarketplaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketplaceApplication.class, args);
    }

}