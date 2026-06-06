import { test, expect, request } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, '..', 'fixtures');
const BACKEND = 'http://localhost:8080';

test.beforeEach(async () => {
  const api = await request.newContext({ baseURL: BACKEND });
  await api.delete('/api/v1/sessions/today');
  await api.dispose();
});

test('UC-06+07+08+09: Q2 geography voting — player submits country, host closes voting, both see reveal, navigate to Results and Leaderboard', async ({
  page,
  browser,
}) => {
  // ── Setup: bring host and player to /quiz ───────────────────────────────
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Firmen-ID' }).fill('test-company');
  await page.getByRole('textbox', { name: 'Anzeigename' }).fill('Alice Host');
  await page.getByRole('button', { name: 'Lobby erstellen' }).click();
  await expect(page).toHaveURL(/\/host/);
  await page.getByLabel('F1 — Wissen (Kalenderblatt)').setInputFiles(path.join(FIXTURES, 'photo-q1.jpg'));
  await page.getByLabel('F2 — Geografie (Ort)').setInputFiles(path.join(FIXTURES, 'photo-q2.jpg'));
  await page.getByRole('button', { name: 'Session erstellen' }).click();
  await expect(page).toHaveURL(/\/lobby/);

  const playerContext = await browser.newContext({ baseURL: 'http://localhost:4200' });
  const playerPage = await playerContext.newPage();
  await playerPage.goto('/');
  await playerPage.getByRole('textbox', { name: 'Firmen-ID' }).fill('test-company-player');
  await playerPage.getByRole('textbox', { name: 'Anzeigename' }).fill('Bob Spieler');
  await playerPage.getByRole('button', { name: 'Lobby beitreten' }).click();
  await expect(playerPage).toHaveURL(/\/lobby/);

  await page.getByRole('button', { name: 'Zum Quiz' }).click();
  await page.getByRole('button', { name: 'Quiz starten' }).click();
  await expect(page).toHaveURL(/\/quiz/);
  await playerPage.getByRole('button', { name: 'Zum Quiz' }).click();
  await expect(playerPage).toHaveURL(/\/quiz/);

  // ── Close Q1 voting quickly to reach Q2 state ───────────────────────────
  await page.getByRole('region', { name: 'Host-Steuerung' }).getByRole('radio', { name: 'A' }).check();
  await page.getByRole('button', { name: 'Abstimmung schließen' }).click();
  await expect(page.getByText(/Richtige Antwort:.*A/)).toBeVisible();

  // ── UC-06 Scenario 1: both see Q2 photo ─────────────────────────────────
  await expect(page.getByRole('img', { name: 'Frage 2' })).toBeVisible();
  await playerPage.getByRole('button', { name: 'Neu laden' }).click();
  await expect(playerPage.getByRole('img', { name: 'Frage 2' })).toBeVisible();

  // ── UC-06 Scenario 2: Q1 A/B/C radio group is no longer shown ───────────
  await expect(playerPage.getByRole('radiogroup', { name: 'Antwort' })).not.toBeVisible();

  // ── UC-06 Scenario 3: player types country and submits via autocomplete ──
  const playerCountryInput = playerPage.getByRole('combobox', { name: 'Land' });
  await playerCountryInput.click();
  await playerCountryInput.fill('Deutsch');
  await playerPage.getByRole('option', { name: 'Deutschland' }).click();

  // ── UC-07 Scenario 1: host sees Q2 answer count update ──────────────────
  await page.getByRole('button', { name: 'Neu laden' }).click();
  await expect(page.getByText('1/2 beantwortet')).toBeVisible();

  // ── UC-07 Scenario 2: host selects correct country via typeahead ─────────
  const hostControls = page.getByRole('region', { name: 'Host-Steuerung' });
  const hostCountryInput = hostControls.getByRole('combobox', { name: 'Land' });
  await hostCountryInput.click();
  await hostCountryInput.fill('Deutsch');
  await page.getByRole('option', { name: 'Deutschland' }).click();

  // ── UC-07 Scenario 3: host closes Q2 voting ─────────────────────────────
  await hostControls.getByRole('button', { name: 'Abstimmung schließen' }).click();

  // ── UC-07 Scenario 4: host sees Q2 reveal with correct country + answers ─
  await expect(page.getByText(/Richtige Antwort:.*Deutschland/)).toBeVisible();
  await expect(page.getByText('Bob Spieler')).toBeVisible();

  // ── UC-07 Scenario 5 / UC-08 Scenario 1: player refreshes — session is Ended → navigates to /results ──
  await playerPage.getByRole('button', { name: 'Neu laden' }).click();
  await expect(playerPage).toHaveURL(/\/results/);

  // ── UC-08 Scenario 2: host navigates to /results via Zu den Ergebnissen ──
  await page.getByRole('button', { name: 'Zu den Ergebnissen' }).click();
  await expect(page).toHaveURL(/\/results/);

  // ── UC-08 Scenario 3: Results screen shows 'Heutige Ergebnisse' with both players ──
  await expect(page.getByRole('heading', { name: 'Heutige Ergebnisse' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: 'Alice Host' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: 'Bob Spieler' })).toBeVisible();

  // ── UC-09 Scenario 1: host clicks 'Zum Leaderboard' → navigates to /leaderboard ──
  await page.getByRole('button', { name: 'Zum Leaderboard' }).click();
  await expect(page).toHaveURL(/\/leaderboard/);

  // ── UC-09 Scenario 2: leaderboard shows ranked table with both players' cumulative points ──
  await expect(page.getByRole('cell', { name: 'Alice Host' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Bob Spieler' })).toBeVisible();

  await playerContext.close();
});
