package com.lambda.activity_service.service;

import com.lambda.activity_service.activity.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActivityEventPublisher")
class ActivityEventPublisherTest {

    @Mock RabbitTemplate rabbitTemplate;
    @InjectMocks ActivityEventPublisher eventPublisher;

    @Nested @DisplayName("publishCreated()")
    class PublishCreated {

        @Test @DisplayName("deve publicar na fila activity.created com os dados corretos")
        void shouldPublishToCreatedQueue() {
            eventPublisher.publishCreated(1L, 10L, "5511999999999");

            verify(rabbitTemplate).convertAndSend(
                    eq("activity.created"),
                    (Object) argThat(payload -> {
                        ActivityCreatedEvent event = (ActivityCreatedEvent) payload;
                        return event.userId().equals(1L)
                                && event.activityId().equals(10L)
                                && event.phone().equals("5511999999999");
                    })
            );
        }

        @Test @DisplayName("deve publicar mesmo quando phone é nulo")
        void shouldPublishWhenPhoneIsNull() {
            eventPublisher.publishCreated(1L, 10L, null);

            verify(rabbitTemplate).convertAndSend(eq("activity.created"), (Object) any());
        }
    }

    @Nested @DisplayName("publishError()")
    class PublishError {

        @Test @DisplayName("deve publicar na fila activity.error com a mensagem original e o erro")
        void shouldPublishToErrorQueue() {
            ActivityRequestDTO request = new ActivityRequestDTO(
                    99L, "Treino", null, "TREINO", 45, LocalDate.now(), "WHATSAPP");

            eventPublisher.publishError(request, "Usuário não encontrado: id=99");

            verify(rabbitTemplate).convertAndSend(
                    eq("activity.error"),
                    (Object) argThat(payload -> {
                        ActivityErrorEvent event = (ActivityErrorEvent) payload;
                        return event.originalRequest().equals(request)
                                && event.error().contains("99");
                    })
            );
        }
    }
}
