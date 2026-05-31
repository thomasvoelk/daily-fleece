package de.dailyfleece.backend.player.domain;

import static org.assertj.core.api.Assertions.assertThat;

import de.dailyfleece.backend.player.api.CompanyId;
import de.dailyfleece.backend.player.api.PlayerName;
import org.junit.jupiter.api.Test;

class PlayerTest {

    @Test
    void register_creates_player_with_provided_display_name() {
        Player player = Player.register(new CompanyId("comp-1"), new PlayerName("Thomas"));

        assertThat(player.displayName()).isEqualTo(new PlayerName("Thomas"));
    }

    @Test
    void register_assigns_a_non_blank_stable_id() {
        Player player = Player.register(new CompanyId("comp-1"), new PlayerName("Thomas"));

        assertThat(player.playerId()).isNotNull();
    }

    @Test
    void two_registrations_with_different_company_ids_produce_different_player_ids() {
        Player p1 = Player.register(new CompanyId("comp-1"), new PlayerName("Thomas"));
        Player p2 = Player.register(new CompanyId("comp-2"), new PlayerName("Thomas"));

        assertThat(p1.playerId()).isNotEqualTo(p2.playerId());
    }
}
