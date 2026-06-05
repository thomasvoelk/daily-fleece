import { test, expect, request } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, '..', 'fixtures');
const BACKEND = 'http://localhost:8080';

test.beforeEach(async () => {
  const api = await request.newContext({ baseURL: BACKEND });
  await api.delete('/api/v1/sessions/today');
  await api.dispose();
});

test('UC-04+05: Q1 voting — answer submission, refresh, close voting, reveal', async ({ page, browser }) => {
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

  // Navigate both to /quiz
  await page.getByRole('button', { name: 'Zum Quiz' }).click();
  await page.getByRole('button', { name: 'Quiz starten' }).click();
  await expect(page).toHaveURL(/\/quiz/);
  await playerPage.getByRole('button', { name: 'Zum Quiz' }).click();
  await expect(playerPage).toHaveURL(/\/quiz/);

  // ── UC-04 Scenario 1: both see Q1 photo ─────────────────────────────────
  await expect(page.getByRole('img', { name: 'Frage 1' })).toBeVisible();
  await expect(playerPage.getByRole('img', { name: 'Frage 1' })).toBeVisible();

  // ── UC-04 Scenario 2: player selects A — radio checked ─────────────────
  const playerAnswerGroup = playerPage.getByRole('radiogroup', { name: 'Antwort' });
  await playerAnswerGroup.getByRole('radio', { name: 'A', exact: true }).check();
  await expect(playerAnswerGroup.getByRole('radio', { name: 'A', exact: true })).toBeChecked();

  // ── UC-04 Scenario 3: player changes to B — B checked, A not ───────────
  await playerAnswerGroup.getByRole('radio', { name: 'B', exact: true }).check();
  await expect(playerAnswerGroup.getByRole('radio', { name: 'B', exact: true })).toBeChecked();
  await expect(playerAnswerGroup.getByRole('radio', { name: 'A', exact: true })).not.toBeChecked();

  // ── UC-04 Scenario 4: host refreshes — answer count shows 1/2 ──────────
  await page.getByRole('button', { name: 'Aktualisieren' }).click();
  await expect(page.getByText('1/2 beantwortet')).toBeVisible();

  // ── UC-05 Scenario 1: host picks correct answer A and closes voting ──────
  await page.getByRole('region', { name: 'Host-Steuerung' }).getByRole('radio', { name: 'A' }).check();
  await page.getByRole('button', { name: 'Abstimmung schließen' }).click();

  // ── UC-05 Scenario 2: host sees reveal — correct answer and all answers ──
  await expect(page.getByText(/Richtige Antwort:.*A/)).toBeVisible();
  await expect(page.getByText('Bob Spieler')).toBeVisible();
  await expect(page.getByRole('list').getByRole('listitem').filter({ hasText: 'Bob Spieler' })).toContainText('B');
  await expect(page.getByRole('button', { name: 'Abstimmung schließen' })).not.toBeEnabled();

  // ── UC-05 Scenario 3: player refreshes — sees same revealed state ────────
  await playerPage.getByRole('button', { name: 'Aktualisieren' }).click();
  await expect(playerPage.getByText(/Richtige Antwort:.*A/)).toBeVisible();
  await expect(playerPage.getByRole('list').getByRole('listitem').filter({ hasText: 'Bob Spieler' })).toContainText('B');

  await playerContext.close();
});
