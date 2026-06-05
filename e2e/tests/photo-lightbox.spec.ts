import { test, expect, request } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, '..', 'fixtures');
const BACKEND = 'http://localhost:8080';

test.beforeEach(async () => {
  const api = await request.newContext({ baseURL: BACKEND });
  await api.delete('/api/v1/sessions/today');
  await api.dispose();
});

async function navigateToQuiz(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Firmen-ID' }).fill('test-company');
  await page.getByRole('textbox', { name: 'Anzeigename' }).fill('Alice Host');
  await page.getByRole('button', { name: 'Lobby erstellen' }).click();
  await expect(page).toHaveURL(/\/host/);
  await page.getByLabel('F1 — Wissen (Kalenderblatt)').setInputFiles(path.join(FIXTURES, 'photo-q1.jpg'));
  await page.getByLabel('F2 — Geografie (Ort)').setInputFiles(path.join(FIXTURES, 'photo-q2.jpg'));
  await page.getByRole('button', { name: 'Session erstellen' }).click();
  await expect(page).toHaveURL(/\/lobby/);
  await page.getByRole('button', { name: 'Zum Quiz' }).click();
  await page.getByRole('button', { name: 'Quiz starten' }).click();
  await expect(page).toHaveURL(/\/quiz/);
}

test('Q1 photo is visible on quiz page', async ({ page }) => {
  await navigateToQuiz(page);

  await expect(page.getByRole('img', { name: 'Frage 1' })).toBeVisible();
});

test('tippen auf Q1-Foto öffnet Lightbox', async ({ page }) => {
  await navigateToQuiz(page);

  await page.getByRole('img', { name: 'Frage 1' }).click();

  await expect(page.getByRole('img', { name: 'Frage 1 vergrößert' })).toBeVisible();
});

test('tippen auf Foto in der Lightbox schließt sie', async ({ page }) => {
  await navigateToQuiz(page);

  await page.getByRole('img', { name: 'Frage 1' }).click();
  await page.getByRole('img', { name: 'Frage 1 vergrößert' }).click();

  await expect(page.getByRole('img', { name: 'Frage 1 vergrößert' })).not.toBeVisible();
});

test('Schließen-Button schließt die Lightbox', async ({ page }) => {
  await navigateToQuiz(page);

  await page.getByRole('img', { name: 'Frage 1' }).click();
  await page.getByRole('button', { name: 'Lightbox schließen' }).click();

  await expect(page.getByRole('img', { name: 'Frage 1 vergrößert' })).not.toBeVisible();
});

test('Enter auf Q1-Foto-Button öffnet Lightbox', async ({ page }) => {
  await navigateToQuiz(page);

  await page.getByRole('button', { name: 'Frage 1' }).press('Enter');

  await expect(page.getByRole('dialog')).toBeVisible();
});

test('Escape schließt die Lightbox', async ({ page }) => {
  await navigateToQuiz(page);

  await page.getByRole('img', { name: 'Frage 1' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('dialog').press('Escape');

  await expect(page.getByRole('dialog')).not.toBeVisible();
});

async function closeQ1AndNavigateToQ2(page: import('@playwright/test').Page) {
  await navigateToQuiz(page);
  await page.getByRole('region', { name: 'Host-Steuerung' }).getByRole('radio', { name: 'A' }).check();
  await page.getByRole('button', { name: 'Abstimmung schließen' }).click();
}

test('Q2-Foto ist nach Schließen von Q1 sichtbar', async ({ page }) => {
  await closeQ1AndNavigateToQ2(page);

  await expect(page.getByRole('img', { name: 'Frage 2' })).toBeVisible();
});

test('tippen auf Q2-Foto öffnet Lightbox', async ({ page }) => {
  await closeQ1AndNavigateToQ2(page);

  await page.getByRole('img', { name: 'Frage 2' }).click();

  await expect(page.getByRole('img', { name: 'Frage 2 vergrößert' })).toBeVisible();
});

test('tippen auf Foto in der Q2-Lightbox schließt sie', async ({ page }) => {
  await closeQ1AndNavigateToQ2(page);

  await page.getByRole('img', { name: 'Frage 2' }).click();
  await page.getByRole('img', { name: 'Frage 2 vergrößert' }).click();

  await expect(page.getByRole('img', { name: 'Frage 2 vergrößert' })).not.toBeVisible();
});

test('Schließen-Button schließt die Q2-Lightbox', async ({ page }) => {
  await closeQ1AndNavigateToQ2(page);

  await page.getByRole('img', { name: 'Frage 2' }).click();
  await page.getByRole('button', { name: 'Lightbox schließen' }).click();

  await expect(page.getByRole('img', { name: 'Frage 2 vergrößert' })).not.toBeVisible();
});
