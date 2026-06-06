import { test, expect } from '@playwright/test';
import { clearSession, navigateToQuiz, closeQ1Voting } from './helpers';

test.beforeEach(async () => {
  await clearSession();
});

async function closeQ1AndNavigateToQ2(page: import('@playwright/test').Page) {
  await navigateToQuiz(page);
  await closeQ1Voting(page);
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
