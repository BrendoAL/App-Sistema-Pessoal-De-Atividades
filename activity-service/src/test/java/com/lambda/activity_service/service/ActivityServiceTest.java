package com.lambda.activity_service.service;

import com.lambda.activity_service.activity.*;
import com.lambda.activity_service.exception.UserNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActivityService")
class ActivityServiceTest {

    @Mock ActivityRepository activityRepository;
    @Mock UserServiceClient userServiceClient;
    @InjectMocks ActivityService activityService;

    @Nested @DisplayName("create()")
    class Create {

        @Test @DisplayName("deve salvar atividade e retornar ID quando dados válidos")
        void shouldSaveAndReturnId() {
            ActivityRequestDTO request = new ActivityRequestDTO(1L, "Estudar Java", null, "ESTUDO", 90, LocalDate.now(), "API");
            when(activityRepository.save(any())).thenReturn(Activity.builder().id(10L).build());
            doNothing().when(userServiceClient).validateUser(1L);

            assertThat(activityService.create(request)).isEqualTo(10L);
            verify(activityRepository).save(any());
        }

        @Test @DisplayName("deve validar userId no user-service antes de salvar")
        void shouldValidateUserBeforeSaving() {
            ActivityRequestDTO request = new ActivityRequestDTO(1L, "Treino", null, "TREINO", 45, LocalDate.now(), "API");
            doNothing().when(userServiceClient).validateUser(1L);
            when(activityRepository.save(any())).thenReturn(Activity.builder().id(1L).build());

            activityService.create(request);

            verify(userServiceClient).validateUser(1L);
        }

        @Test @DisplayName("deve lançar UserNotFoundException quando user-service retorna 404")
        void shouldThrowWhenUserNotFound() {
            ActivityRequestDTO request = new ActivityRequestDTO(99L, "Treino", null, "TREINO", 45, LocalDate.now(), "API");
            doThrow(new UserNotFoundException(99L)).when(userServiceClient).validateUser(99L);

            assertThatThrownBy(() -> activityService.create(request))
                    .isInstanceOf(UserNotFoundException.class);
            verify(activityRepository, never()).save(any());
        }

        @Test @DisplayName("deve salvar com source WHATSAPP quando origem for whatsapp")
        void shouldSaveWithWhatsappSource() {
            ActivityRequestDTO request = new ActivityRequestDTO(1L, "Treino", null, "TREINO", 45, LocalDate.now(), "WHATSAPP");
            doNothing().when(userServiceClient).validateUser(1L);
            when(activityRepository.save(any())).thenReturn(Activity.builder().id(1L).build());

            activityService.create(request);

            verify(activityRepository).save(argThat(a -> "WHATSAPP".equals(a.getSource())));
        }
    }

    @Nested @DisplayName("findByUserId()")
    class FindByUserId {

        @Test @DisplayName("deve retornar lista de atividades do usuário")
        void shouldReturnActivitiesList() {
            Activity activity = Activity.builder().id(1L).userId(1L).category("ESTUDO")
                    .durationMinutes(90).date(LocalDate.now()).source("API").build();
            when(activityRepository.findByUserId(1L)).thenReturn(List.of(activity));

            List<ActivityResponseDTO> result = activityService.findByUserId(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).category()).isEqualTo("ESTUDO");
        }

        @Test @DisplayName("deve retornar lista vazia quando usuário não tem atividades")
        void shouldReturnEmptyList() {
            when(activityRepository.findByUserId(1L)).thenReturn(List.of());
            assertThat(activityService.findByUserId(1L)).isEmpty();
        }
    }

    @Nested @DisplayName("getStats()")
    class GetStats {

        @Test @DisplayName("deve retornar contagem e minutos de hoje e da semana")
        void shouldReturnStats() {
            when(activityRepository.countByUserIdAndDateBetween(eq(1L), any(), any())).thenReturn(3, 8);
            when(activityRepository.sumDurationByUserIdAndDateBetween(eq(1L), any(), any())).thenReturn(150, 400);

            ActivityStatsDTO stats = activityService.getStats(1L);

            assertThat(stats.todayCount()).isEqualTo(3);
            assertThat(stats.todayMinutes()).isEqualTo(150);
            assertThat(stats.weekCount()).isEqualTo(8);
            assertThat(stats.weekMinutes()).isEqualTo(400);
        }

        @Test @DisplayName("deve retornar zeros quando sem atividades")
        void shouldReturnZerosWhenNoActivities() {
            when(activityRepository.countByUserIdAndDateBetween(any(), any(), any())).thenReturn(0);
            when(activityRepository.sumDurationByUserIdAndDateBetween(any(), any(), any())).thenReturn(0);

            ActivityStatsDTO stats = activityService.getStats(1L);

            assertThat(stats.todayCount()).isZero();
            assertThat(stats.todayMinutes()).isZero();
        }
    }
}
