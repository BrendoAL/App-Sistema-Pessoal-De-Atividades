package com.lambda.activity_service.consumer;

import com.lambda.activity_service.activity.*;
import com.lambda.activity_service.exception.UserNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActivityConsumer")
class ActivityConsumerTest {

    @Mock ActivityService activityService;
    @Mock ActivityEventPublisher eventPublisher;
    @InjectMocks ActivityConsumer activityConsumer;

    private ActivityRequestDTO validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new ActivityRequestDTO(1L, "Estudar Java", null, "ESTUDO", 90, LocalDate.now(), "WHATSAPP");
    }

    @Nested @DisplayName("consume()")
    class Consume {

        @Test @DisplayName("deve criar atividade e publicar activity.created quando mensagem válida")
        void shouldCreateActivityAndPublishCreatedEvent() {
            when(activityService.create(any())).thenReturn(10L);

            activityConsumer.consume(validRequest);

            verify(activityService).create(validRequest);
            verify(eventPublisher).publishCreated(eq(1L), eq(10L), any());
        }

        @Test @DisplayName("deve publicar activity.error quando userId não encontrado")
        void shouldPublishErrorWhenUserNotFound() {
            when(activityService.create(any())).thenThrow(new UserNotFoundException(1L));

            activityConsumer.consume(validRequest);

            verify(eventPublisher).publishError(eq(validRequest), anyString());
            verify(eventPublisher, never()).publishCreated(any(), any(), any());
        }

        @Test @DisplayName("deve publicar activity.error quando ocorre erro inesperado")
        void shouldPublishErrorOnUnexpectedException() {
            when(activityService.create(any())).thenThrow(new RuntimeException("erro inesperado"));

            activityConsumer.consume(validRequest);

            verify(eventPublisher).publishError(eq(validRequest), anyString());
            verify(eventPublisher, never()).publishCreated(any(), any(), any());
        }

        @Test @DisplayName("não deve lançar exceção para o RabbitMQ")
        void shouldNotThrowException() {
            when(activityService.create(any())).thenThrow(new RuntimeException("erro"));

            assertThatNoException().isThrownBy(() -> activityConsumer.consume(validRequest));
        }
    }
}
