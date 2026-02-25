FROM eclipse-temurin:25-alpine
WORKDIR /app
COPY target/user-service.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]