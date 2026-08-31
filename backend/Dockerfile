# --- Etapa 1: build con Maven ---
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copiamos primero el wrapper y el pom para aprovechar la cache de capas de Docker
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copiamos el resto del código y compilamos
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# --- Etapa 2: imagen final, solo con el jar y un JRE ligero ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render inyecta la variable PORT; Spring Boot debe escuchar en ese puerto
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]
