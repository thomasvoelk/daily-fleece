import { test, expect } from '@playwright/test';
import { clearSession, navigateToQuizWithPlayer, closeQ1Voting } from './helpers';

test.beforeEach(async () => {
  await clearSession();
});

for (const order of ['player-first', 'host-first'] as const) {
  test.describe(order, () => {
    test('Q2 geography voting — player submits country, host closes voting, results show answers', async ({
      page,
      browser,
    }) => {
      const { playerPage, playerContext } = await navigateToQuizWithPlayer(page, browser);
      await closeQ1Voting(page);

      // ── both see Q2 photo ────────────────────────────────────────────────────
      await expect(page.getByRole('img', { name: 'Frage 2' })).toBeVisible();
      await playerPage.getByRole('button', { name: 'Neu laden' }).click();
      await expect(playerPage).toHaveURL(/\/q2/);
      await expect(playerPage.getByRole('img', { name: 'Frage 2' })).toBeVisible();

      // ── Q1 A/B/C radio group is no longer shown ──────────────────────────────
      await expect(playerPage.getByRole('radiogroup', { name: 'Antwort' })).not.toBeVisible();

      // ── host-first: host refreshes before player votes — count is 0/2 ────────
      if (order === 'host-first') {
        await page.getByRole('button', { name: 'Neu laden' }).click();
        await expect(page.getByText('0/2 beantwortet')).toBeVisible();
      }

      // ── player types country and submits via autocomplete ────────────────────
      const playerCountryInput = playerPage.getByRole('combobox', { name: 'Deine Antwort' });
      await playerCountryInput.click();
      await playerCountryInput.fill('Deutsch');
      await playerPage.getByRole('option', { name: 'Deutschland' }).click();

      // ── host refreshes — answer count shows 1/2 ─────────────────────────────
      await page.getByRole('button', { name: 'Neu laden' }).click();
      await expect(page.getByText('1/2 beantwortet')).toBeVisible();

      // ── host selects correct country via typeahead ───────────────────────────
      const hostControls = page.getByRole('region', { name: 'Host-Steuerung' });
      const hostCountryInput = hostControls.getByRole('combobox', { name: 'Richtige Antwort' });
      await hostCountryInput.click();
      await hostCountryInput.fill('Deutsch');
      await page.getByRole('option', { name: 'Deutschland' }).click();

      // ── host closes Q2 voting ────────────────────────────────────────────────
      await hostControls.getByRole('button', { name: 'Abstimmung schließen' }).click();

      // ── host auto-navigates to /results ─────────────────────────────────────
      await expect(page).toHaveURL(/\/results/);

      // ── results table shows correct Q2 answer in column header ───────────────
      await expect(page.getByRole('columnheader', { name: /Deutschland/ })).toBeVisible();

      // ── Bob Spieler's row is in the results table ────────────────────────────
      await expect(page.getByRole('row', { name: 'Bob Spieler' })).toBeVisible();

      await playerContext.close();
    });
  });
}
