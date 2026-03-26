package com.lambda.activity_service.service;

import com.lambda.activity_service.whatsappmessage.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WhatsappMessageService")
class WhatsappMessageServiceTest {

    @Mock
    WhatsappMessageRepository whatsappMessageRepository;
    @InjectMocks
    WhatsappMessageService whatsappMessageService;

    @Nested @DisplayName("save()")
    class Save {

        @Test @DisplayName("deve salvar mensagem e retornar ID")
        void shouldSaveAndReturnId() {
            WhatsappMessageRequestDTO request = new WhatsappMessageRequestDTO(
                    "5511999999999", "estudei 2h java", "ESTUDO", 120, "Java");
            WhatsappMessage saved = WhatsappMessage.builder().id(1L).phoneNumber("5511999999999")
                    .messageText("estudei 2h java").parsedCategory("ESTUDO")
                    .parsedDuration(120).parsedTitle("Java").processed(false).build();

            when(whatsappMessageRepository.save(any())).thenReturn(saved);

            assertThat(whatsappMessageService.save(request)).isEqualTo(1L);
            verify(whatsappMessageRepository).save(any());
        }

        @Test @DisplayName("deve salvar mensagem com processed = false por padrão")
        void shouldSaveAsNotProcessedByDefault() {
            WhatsappMessageRequestDTO request = new WhatsappMessageRequestDTO(
                    "5511999999999", "treinei 45min", "TREINO", 45, null);
            when(whatsappMessageRepository.save(any())).thenReturn(WhatsappMessage.builder().id(1L).build());

            whatsappMessageService.save(request);

            verify(whatsappMessageRepository).save(argThat(m -> !m.isProcessed()));
        }
    }

    @Nested @DisplayName("markAsProcessed()")
    class MarkAsProcessed {

        @Test @DisplayName("deve marcar mensagem como processada e vincular activityId")
        void shouldMarkAsProcessed() {
            WhatsappMessage message = WhatsappMessage.builder().id(1L).processed(false).build();
            when(whatsappMessageRepository.findById(1L)).thenReturn(Optional.of(message));
            when(whatsappMessageRepository.save(any())).thenReturn(message);

            whatsappMessageService.markAsProcessed(1L, 42L);

            verify(whatsappMessageRepository).save(argThat(m -> m.isProcessed() && m.getActivityId().equals(42L)));
        }
    }

    @Nested @DisplayName("findByPhone()")
    class FindByPhone {

        @Test @DisplayName("deve retornar histórico de mensagens do número")
        void shouldReturnMessageHistory() {
            WhatsappMessage msg = WhatsappMessage.builder().id(1L).phoneNumber("5511999999999")
                    .messageText("estudei 2h java").parsedCategory("ESTUDO").processed(true).build();
            when(whatsappMessageRepository.findByPhoneNumberOrderByCreatedAtDesc("5511999999999"))
                    .thenReturn(List.of(msg));

            List<WhatsappMessageResponseDTO> result = whatsappMessageService.findByPhone("5511999999999");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).messageText()).isEqualTo("estudei 2h java");
            assertThat(result.get(0).parsedCategory()).isEqualTo("ESTUDO");
        }

        @Test @DisplayName("deve retornar lista vazia quando sem histórico")
        void shouldReturnEmptyWhenNoHistory() {
            when(whatsappMessageRepository.findByPhoneNumberOrderByCreatedAtDesc(anyString()))
                    .thenReturn(List.of());

            assertThat(whatsappMessageService.findByPhone("0")).isEmpty();
        }
    }
}
