FROM eclipse-temurin:25-jdk-alpine
WORKDIR /app
COPY target/user-service.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]