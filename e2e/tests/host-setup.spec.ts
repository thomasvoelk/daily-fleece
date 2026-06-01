import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, '..', 'fixtures');

test('host creates lobby, uploads photos, and appears in player list', async ({ page }) => {
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
  const playerList = page.getByRole('list', { name: 'Spieler in der Session' });
  await expect(playerList.getByRole('listitem').filter({ hasText: 'Alice Host' })).toBeVisible();
});
