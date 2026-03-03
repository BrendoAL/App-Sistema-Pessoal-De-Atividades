# ─── STAGE 1: BUILD ──────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle .
COPY settings.gradle .

RUN chmod +x gradlew

# Mostra erros reais se falhar (sem || true)
RUN ./gradlew dependencies --no-daemon

COPY src/ src/

# Para ver o erro real de compilação, sem -x test por enquanto
RUN ./gradlew bootJar --no-daemon -x test --stacktrace

# ─── STAGE 2: RUNTIME ────────────────────────────────────
FROM amazoncorretto:25-alpine

WORKDIR /app

COPY --from=build /app/build/libs/activity-service.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]