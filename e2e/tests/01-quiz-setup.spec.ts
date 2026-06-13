import { test, expect } from '@playwright/test';
import { Q1_PHOTO, Q2_PHOTO, clearSession } from './helpers';

test.beforeEach(async () => {
  await clearSession();
});

test('full pre-game flow: lobby creation, player join, and quiz start', async ({ page, browser }) => {
  await page.goto('/');

  // Step 1: Entry — fill in Company ID + Display Name, click Create Lobby
  await page.getByRole('textbox', { name: 'Firmen-ID' }).fill('test-company');
  await page.getByRole('textbox', { name: 'Anzeigename' }).fill('Alice Host');
  await page.getByRole('button', { name: 'Lobby erstellen' }).click();

  // Step 2: HostSetup — upload Q1 and Q2 photos, click Create Session
  await expect(page).toHaveURL(/\/host/);
  await page.getByLabel('F1 — Wissen (Kalenderblatt)').setInputFiles(Q1_PHOTO);
  await page.getByLabel('F2 — Geografie (Ort)').setInputFiles(Q2_PHOTO);
  await page.getByRole('button', { name: 'Session erstellen' }).click();

  // Step 3: Lobby — host's display name appears in the player list
  await expect(page).toHaveURL(/\/session\/default\/.*\/lobby/);
  const hostPlayerList = page.getByRole('list', { name: 'Spieler in der Session' });
  await expect(hostPlayerList.getByRole('listitem').filter({ hasText: 'Alice Host' })).toBeVisible();

  // Step 4: Player opens the app in a separate browser context, enters Company ID + Display Name, clicks Join Lobby
  const playerContext = await browser.newContext({ baseURL: 'http://localhost:4200' });
  const playerPage = await playerContext.newPage();
  await playerPage.goto('/');
  await playerPage.getByRole('textbox', { name: 'Firmen-ID' }).fill('test-company-player');
  await playerPage.getByRole('textbox', { name: 'Anzeigename' }).fill('Bob Spieler');
  await playerPage.getByRole('button', { name: 'Lobby beitreten' }).click();

  // Step 5: Player lands on Lobby and their display name appears in the player list
  await expect(playerPage).toHaveURL(/\/session\/default\/.*\/lobby/);
  const playerLobbyList = playerPage.getByRole('list', { name: 'Spieler in der Session' });
  await expect(playerLobbyList.getByRole('listitem').filter({ hasText: 'Bob Spieler' })).toBeVisible();

  // Step 6: "Quiz starten" button is not visible in the Player's Lobby (player is not the host)
  await expect(playerPage.getByRole('button', { name: 'Quiz starten' })).not.toBeVisible();

  // Player clicks "Zum Quiz" before host starts → inline error, stays on Lobby
  await playerPage.getByRole('button', { name: 'Zum Quiz' }).click();
  await expect(playerPage.getByRole('alert')).toHaveText('Quiz noch nicht gestartet. Bitte warten.');
  await expect(playerPage).toHaveURL(/\/session\/default\/.*\/lobby/);

  // Host clicks "Quiz starten" → session Active, host auto-navigates to /q1
  await page.getByRole('button', { name: 'Quiz starten' }).click();
  await expect(page).toHaveURL(/\/q[12]/);

  // Player clicks "Zum Quiz" after host started → navigates to /q1
  await playerPage.getByRole('button', { name: 'Zum Quiz' }).click();
  await expect(playerPage).toHaveURL(/\/q[12]/);

  await playerContext.close();
});
