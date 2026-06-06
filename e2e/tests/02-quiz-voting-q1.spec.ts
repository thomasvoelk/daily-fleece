import { test, expect } from '@playwright/test';
import { clearSession, navigateToQuizWithPlayer } from './helpers';

test.beforeEach(async () => {
  await clearSession();
});

for (const order of ['player-first', 'host-first'] as const) {
  test.describe(order, () => {
    test('Q1 voting — answer submission, refresh, close voting, reveal', async ({ page, browser }) => {
      const { playerPage, playerContext } = await navigateToQuizWithPlayer(page, browser);

      // ── both see Q1 photo ────────────────────────────────────────────────────
      await expect(page.getByRole('img', { name: 'Frage 1' })).toBeVisible();
      await expect(playerPage.getByRole('img', { name: 'Frage 1' })).toBeVisible();

      const playerAnswerGroup = playerPage.getByRole('radiogroup', { name: 'Antwort' });

      // ── host-first: host refreshes before player votes — count is 0/2 ────────
      if (order === 'host-first') {
        await page.getByRole('button', { name: 'Neu laden' }).click();
        await expect(page.getByText('0/2 beantwortet')).toBeVisible();
      }

      // ── player selects A — radio checked ────────────────────────────────────
      await playerAnswerGroup.getByRole('radio', { name: 'A', exact: true }).check();
      await expect(playerAnswerGroup.getByRole('radio', { name: 'A', exact: true })).toBeChecked();

      // ── player changes to B — B checked, A not ──────────────────────────────
      await playerAnswerGroup.getByRole('radio', { name: 'B', exact: true }).check();
      await expect(playerAnswerGroup.getByRole('radio', { name: 'B', exact: true })).toBeChecked();
      await expect(playerAnswerGroup.getByRole('radio', { name: 'A', exact: true })).not.toBeChecked();

      // ── host refreshes — answer count shows 1/2 ─────────────────────────────
      await page.getByRole('button', { name: 'Neu laden' }).click();
      await expect(page.getByText('1/2 beantwortet')).toBeVisible();

      // ── host picks correct answer A and closes voting ────────────────────────
      await page.getByRole('region', { name: 'Host-Steuerung' }).getByRole('radio', { name: 'A' }).check();
      await page.getByRole('button', { name: 'Abstimmung schließen' }).click();

      // ── host sees reveal — correct answer and all answers ────────────────────
      await expect(page.getByText(/Richtige Antwort:.*A/)).toBeVisible();
      await expect(page.getByText('Bob Spieler')).toBeVisible();
      await expect(page.getByRole('list').getByRole('listitem').filter({ hasText: 'Bob Spieler' })).toContainText('B');
      await expect(page.getByRole('button', { name: 'Abstimmung schließen' })).not.toBeEnabled();

      // ── player refreshes — sees same revealed state ──────────────────────────
      await playerPage.getByRole('button', { name: 'Neu laden' }).click();
      await expect(playerPage.getByText(/Richtige Antwort:.*A/)).toBeVisible();
      await expect(playerPage.getByRole('list').getByRole('listitem').filter({ hasText: 'Bob Spieler' })).toContainText('B');

      await playerContext.close();
    });
  });
}
