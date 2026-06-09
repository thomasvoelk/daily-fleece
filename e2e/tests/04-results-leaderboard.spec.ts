import { test, expect } from '@playwright/test';
import { clearSession, completeQuizWithPlayer } from './helpers';

test.beforeEach(async () => {
  await clearSession();
});

test('results and leaderboard after completed quiz', async ({ page, browser }) => {
  const { playerPage, playerContext } = await completeQuizWithPlayer(page, browser);

  // ── host auto-navigated to /results after closing Q2 voting ─────────────
  await expect(page).toHaveURL(/\/results/);

  // ── player refreshes — session Ended → navigates to /results ────────────
  await playerPage.getByRole('button', { name: 'Neu laden' }).click();
  await expect(playerPage).toHaveURL(/\/results/);

  // ── results screen shows both players in the table ───────────────────────
  await expect(page.getByRole('heading', { name: 'Heutige Ergebnisse' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Alice Host' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Bob Spieler' })).toBeVisible();

  // ── host navigates to /leaderboard ──────────────────────────────────────
  await page.getByRole('button', { name: 'Zum Leaderboard' }).click();
  await expect(page).toHaveURL(/\/leaderboard/);

  // ── leaderboard shows ranked table with both players' cumulative points ──
  await expect(page.getByRole('cell', { name: 'Alice Host' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Bob Spieler' })).toBeVisible();

  await playerContext.close();
});
