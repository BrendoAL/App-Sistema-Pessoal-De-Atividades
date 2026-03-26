package com.lambda.activity_service.repository;

import com.lambda.activity_service.whatsappmessage.WhatsappMessage;
import com.lambda.activity_service.whatsappmessage.WhatsappMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("WhatsappMessageRepository")
class WhatsappMessageRepositoryTest {

    @Autowired
    WhatsappMessageRepository whatsappMessageRepository;

    @BeforeEach
    void setUp() {
        whatsappMessageRepository.save(WhatsappMessage.builder()
                .phoneNumber("5511999999999").messageText("estudei 2h java")
                .parsedCategory("ESTUDO").parsedDuration(120).processed(true).build());
        whatsappMessageRepository.save(WhatsappMessage.builder()
                .phoneNumber("5511999999999").messageText("treinei 45min")
                .parsedCategory("TREINO").parsedDuration(45).processed(false).build());
        whatsappMessageRepository.save(WhatsappMessage.builder()
                .phoneNumber("5511888888888").messageText("li 30min")
                .parsedCategory("LEITURA").parsedDuration(30).processed(true).build());
    }

    @Nested
    @DisplayName("findByPhoneNumberOrderByCreatedAtDesc()")
    class FindByPhone {

        @Test
        @DisplayName("deve retornar mensagens do número em ordem decrescente de data")
        void shouldReturnMessagesOrderedByDate() {
            List<WhatsappMessage> result = whatsappMessageRepository
                    .findByPhoneNumberOrderByCreatedAtDesc("5511999999999");

            assertThat(result).hasSize(2);
            assertThat(result).allMatch(m -> m.getPhoneNumber().equals("5511999999999"));
        }

        @Test
        @DisplayName("não deve retornar mensagens de outros números")
        void shouldNotReturnOtherPhoneMessages() {
            List<WhatsappMessage> result = whatsappMessageRepository
                    .findByPhoneNumberOrderByCreatedAtDesc("5511999999999");

            assertThat(result).noneMatch(m -> m.getPhoneNumber().equals("5511888888888"));
        }

        @Test
        @DisplayName("deve retornar lista vazia quando número não tem histórico")
        void shouldReturnEmptyWhenNoHistory() {
            List<WhatsappMessage> result = whatsappMessageRepository
                    .findByPhoneNumberOrderByCreatedAtDesc("0000000000");

            assertThat(result).isEmpty();
        }
    }
}
