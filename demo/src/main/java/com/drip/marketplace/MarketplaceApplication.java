package com.drip.marketplace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de la aplicacion Spring Boot. @SpringBootApplication
 * activa el auto-scanning de componentes (@Service, @RestController,
 * @Repository...) dentro de este paquete y sus subpaquetes — por eso es
 * critico que todas las clases del backend vivan bajo com.drip.marketplace.
 */
@SpringBootApplication
public class MarketplaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(MarketplaceApplication.class, args);
	}

}
