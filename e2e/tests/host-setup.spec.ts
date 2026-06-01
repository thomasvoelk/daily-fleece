import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, '..', 'fixtures');

test('host creates lobby, player joins, and host sees player after refresh', async ({ page, browser }) => {
  await page.goto('/');

  // Step 1: Entry — fill in Company ID + Display Name, click Create Lobby
  await page.locator('#companyId').fill('test-company');
  await page.locator('#displayName').fill('Alice Host');
  await page.getByRole('button', { name: 'Lobby erstellen' }).click();

  // Step 2: HostSetup — upload Q1 and Q2 photos, click Create Session
  await expect(page).toHaveURL(/\/host/);
  await page.locator('#q1').setInputFiles(path.join(FIXTURES, 'photo-q1.jpg'));
  await page.locator('#q2').setInputFiles(path.join(FIXTURES, 'photo-q2.jpg'));
  await page.getByRole('button', { name: 'Session erstellen' }).click();

  // Step 3: Lobby — host's display name appears in the player list
  await expect(page).toHaveURL(/\/lobby/);
  const hostPlayerList = page.getByRole('list', { name: 'Spieler in der Session' });
  await expect(hostPlayerList.getByRole('listitem').filter({ hasText: 'Alice Host' })).toBeVisible();

  // Step 4: Player opens the app in a separate browser context, enters Company ID + Display Name, clicks Join Lobby
  const playerContext = await browser.newContext({ baseURL: 'http://localhost:4200' });
  const playerPage = await playerContext.newPage();
  await playerPage.goto('/');
  await playerPage.locator('#companyId').fill('test-company');
  await playerPage.locator('#displayName').fill('Bob Spieler');
  await playerPage.getByRole('button', { name: 'Lobby beitreten' }).click();

  // Step 5: Player lands on Lobby and their display name appears in the player list
  await expect(playerPage).toHaveURL(/\/lobby/);
  const playerLobbyList = playerPage.getByRole('list', { name: 'Spieler in der Session' });
  await expect(playerLobbyList.getByRole('listitem').filter({ hasText: 'Bob Spieler' })).toBeVisible();

  // Step 6: Host clicks Refresh — player's display name now appears in host's Lobby
  await page.getByRole('button', { name: 'Aktualisieren' }).click();
  await expect(hostPlayerList.getByRole('listitem').filter({ hasText: 'Bob Spieler' })).toBeVisible();

  await playerContext.close();
});
