package de.dailyfleece.backend.quiz.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.TestcontainersConfiguration;
import de.dailyfleece.backend.player.api.PlayerName;
import de.dailyfleece.backend.quiz.domain.PhotoId;
import de.dailyfleece.backend.quiz.domain.Session;
import de.dailyfleece.backend.quiz.domain.SessionPhotos;
import de.dailyfleece.backend.quiz.domain.SessionRepository;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.modulith.test.ApplicationModuleTest;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class SessionRepositoryTest {

    @Autowired
    private SessionRepository sessionRepository;

    private static final UUID HOST_ID = UUID.fromString("00000000-0000-0000-0000-000000000099");
    private static final SessionPhotos PHOTOS =
            new SessionPhotos(new PhotoId("aaaaaaaaaaaaaaaaaaaaaaaa"), new PhotoId("bbbbbbbbbbbbbbbbbbbbbbbb"));

    @Test
    void save_and_findById_roundtrip() {
        Session session = Session.create(LocalDate.parse("2099-01-01"), HOST_ID, new PlayerName("Host"), PHOTOS);
        sessionRepository.save(session);

        assertThat(sessionRepository.findById(session.sessionId()))
                .map(Session::sessionId)
                .contains(session.sessionId());
    }

    @Test
    void findByDate_returns_saved_session() {
        LocalDate date = LocalDate.parse("2099-01-02");
        Session session = Session.create(date, HOST_ID, new PlayerName("Host"), PHOTOS);
        sessionRepository.save(session);

        assertThat(sessionRepository.findByDate(date)).map(Session::date).contains(date);
    }

    @Test
    void save_and_findById_preserves_photo_ids() {
        Session session = Session.create(LocalDate.parse("2099-01-04"), HOST_ID, new PlayerName("Host"), PHOTOS);
        sessionRepository.save(session);

        assertThat(sessionRepository.findById(session.sessionId()).orElseThrow().photos())
                .isEqualTo(PHOTOS);
    }

    @Test
    void findById_returns_empty_for_unknown_session() {
        assertThat(sessionRepository.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByDate_returns_empty_when_no_session_for_date() {
        assertThat(sessionRepository.findByDate(LocalDate.parse("2099-01-03"))).isEmpty();
    }
}
