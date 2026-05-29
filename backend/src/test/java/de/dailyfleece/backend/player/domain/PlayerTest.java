package de.dailyfleece.backend.player.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlayerTest {

    @Test
    void register_creates_player_with_provided_display_name() {
        Player player = Player.register("Thomas");

        assertThat(player.displayName()).isEqualTo("Thomas");
    }

    @Test
    void register_assigns_a_non_blank_stable_id() {
        Player player = Player.register("Thomas");

        assertThat(player.playerId()).isNotBlank();
    }

    @Test
    void two_registrations_produce_different_ids() {
        Player p1 = Player.register("Thomas");
        Player p2 = Player.register("Thomas");

        assertThat(p1.playerId()).isNotEqualTo(p2.playerId());
    }
}
