import { expect, request, Browser, BrowserContext, Page } from '@playwright/test';
import path from 'path';

export const FIXTURES = path.join(__dirname, '..', 'fixtures');
export const Q1_PHOTO = path.join(FIXTURES, 'photo-q1.jpg');
export const Q2_PHOTO = path.join(FIXTURES, 'photo-q2.jpg');

const BACKEND = 'http://localhost:8080';

export async function clearSession(): Promise<void> {
  const api = await request.newContext({ baseURL: BACKEND });
  await api.delete('/api/v1/sessions/today');
  await api.dispose();
}

export async function navigateToQuiz(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Firmen-ID' }).fill('test-company');
  await page.getByRole('textbox', { name: 'Anzeigename' }).fill('Alice Host');
  await page.getByRole('button', { name: 'Lobby erstellen' }).click();
  await expect(page).toHaveURL(/\/host/);
  await page.getByLabel('F1 — Wissen (Kalenderblatt)').setInputFiles(Q1_PHOTO);
  await page.getByLabel('F2 — Geografie (Ort)').setInputFiles(Q2_PHOTO);
  await page.getByRole('button', { name: 'Session erstellen' }).click();
  await expect(page).toHaveURL(/\/lobby/);
  await page.getByRole('button', { name: 'Zum Quiz' }).click();
  await page.getByRole('button', { name: 'Quiz starten' }).click();
  await expect(page).toHaveURL(/\/quiz/);
}

export async function navigateToQuizWithPlayer(
  page: Page,
  browser: Browser,
): Promise<{ playerPage: Page; playerContext: BrowserContext }> {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Firmen-ID' }).fill('test-company');
  await page.getByRole('textbox', { name: 'Anzeigename' }).fill('Alice Host');
  await page.getByRole('button', { name: 'Lobby erstellen' }).click();
  await expect(page).toHaveURL(/\/host/);
  await page.getByLabel('F1 — Wissen (Kalenderblatt)').setInputFiles(Q1_PHOTO);
  await page.getByLabel('F2 — Geografie (Ort)').setInputFiles(Q2_PHOTO);
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

  return { playerPage, playerContext };
}

export async function closeQ1Voting(page: Page): Promise<void> {
  await page.getByRole('region', { name: 'Host-Steuerung' }).getByRole('radio', { name: 'A' }).check();
  await page.getByRole('button', { name: 'Abstimmung schließen' }).click();
  await expect(page.getByText(/Richtige Antwort:.*A/)).toBeVisible();
}

export async function completeQuizWithPlayer(
  page: Page,
  browser: Browser,
): Promise<{ playerPage: Page; playerContext: BrowserContext }> {
  const { playerPage, playerContext } = await navigateToQuizWithPlayer(page, browser);
  await closeQ1Voting(page);

  await playerPage.getByRole('button', { name: 'Neu laden' }).click();

  const playerCountryInput = playerPage.getByRole('combobox', { name: 'Land' });
  await playerCountryInput.click();
  await playerCountryInput.fill('Deutsch');
  await playerPage.getByRole('option', { name: 'Deutschland' }).click();

  const hostControls = page.getByRole('region', { name: 'Host-Steuerung' });
  const hostCountryInput = hostControls.getByRole('combobox', { name: 'Land' });
  await hostCountryInput.click();
  await hostCountryInput.fill('Deutsch');
  await page.getByRole('option', { name: 'Deutschland' }).click();
  await hostControls.getByRole('button', { name: 'Abstimmung schließen' }).click();
  await expect(page.getByText(/Richtige Antwort:.*Deutschland/)).toBeVisible();

  return { playerPage, playerContext };
}
