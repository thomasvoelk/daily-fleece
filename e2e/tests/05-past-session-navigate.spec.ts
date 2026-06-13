import { test, expect, request } from '@playwright/test';
import fs from 'fs';
import { Q1_PHOTO, Q2_PHOTO } from './helpers';

const BACKEND = 'http://localhost:8080';
const HOST_ID = 'a0000000-0000-0000-0000-000000000001';
const PLAYER_ID = 'b0000000-0000-0000-0000-000000000002';

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function clearPastSession(): Promise<void> {
  const api = await request.newContext({ baseURL: BACKEND });
  await api.delete(`/api/v1/sessions/default/${yesterday()}`);
  await api.dispose();
}

async function seedPastSession(): Promise<void> {
  const api = await request.newContext({ baseURL: BACKEND });
  const date = yesterday();

  const create = await api.post(`/api/v1/sessions/default/${date}`, {
    multipart: {
      hostId: HOST_ID,
      hostDisplayName: 'Alice Host',
      q1: { name: 'q1.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(Q1_PHOTO) },
      q2: { name: 'q2.jpg', mimeType: 'image/jpeg', buffer: fs.readFileSync(Q2_PHOTO) },
    },
  });
  if (!create.ok()) throw new Error(`create session failed: ${create.status()} ${await create.text()}`);

  const join = await api.post(`/api/v1/sessions/default/${date}/join`, {
    data: { playerId: PLAYER_ID, displayName: 'Bob Spieler' },
  });
  if (!join.ok()) throw new Error(`join failed: ${join.status()} ${await join.text()}`);

  const start = await api.post(`/api/v1/sessions/default/${date}/start`, {
    data: { hostId: HOST_ID },
  });
  if (!start.ok()) throw new Error(`start failed: ${start.status()} ${await start.text()}`);

  const q1ans = await api.put(`/api/v1/sessions/default/${date}/questions/q1/answers`, {
    data: { playerId: PLAYER_ID, answer: 'B' },
  });
  if (!q1ans.ok()) throw new Error(`q1 answer failed: ${q1ans.status()} ${await q1ans.text()}`);

  const q1correct = await api.post(`/api/v1/sessions/default/${date}/questions/q1/correct`, {
    data: { hostId: HOST_ID, correctAnswer: 'B' },
  });
  if (!q1correct.ok()) throw new Error(`q1 correct failed: ${q1correct.status()} ${await q1correct.text()}`);

  const q2ans = await api.put(`/api/v1/sessions/default/${date}/questions/q2/answers`, {
    data: { playerId: PLAYER_ID, answer: 'DE' },
  });
  if (!q2ans.ok()) throw new Error(`q2 answer failed: ${q2ans.status()} ${await q2ans.text()}`);

  const q2correct = await api.post(`/api/v1/sessions/default/${date}/questions/q2/correct`, {
    data: { hostId: HOST_ID, correctAnswer: 'DE' },
  });
  if (!q2correct.ok()) throw new Error(`q2 correct failed: ${q2correct.status()} ${await q2correct.text()}`);

  await api.dispose();
}

test.beforeEach(async () => {
  await clearPastSession();
  await seedPastSession();
});

// ── Q1: photo and read-only answer list visible without identity ──────────────

test('vergangene Session Q1 — Foto und Antwortliste ohne Identität sichtbar', async ({ page }) => {
  await page.goto(`/session/default/${yesterday()}/q1`);

  await expect(page.getByRole('img', { name: 'Frage 1' })).toBeVisible();

  const list = page.getByRole('list', { name: 'Deine Antwort auf Frage 1' });
  await expect(list).toBeVisible();
  await expect(list.getByRole('listitem', { name: 'A' })).toBeVisible();
  await expect(list.getByRole('listitem', { name: 'B' })).toBeVisible();
  await expect(list.getByRole('listitem', { name: 'C' })).toBeVisible();
});

// ── Q2: photo visible without identity ───────────────────────────────────────

test('vergangene Session Q2 — Foto ohne Identität sichtbar', async ({ page }) => {
  await page.goto(`/session/default/${yesterday()}/q2`);

  await expect(page.getByRole('img', { name: 'Frage 2' })).toBeVisible();
});

// ── Results: table renders without identity ───────────────────────────────────

test('vergangene Session Ergebnisse — Tabelle ohne Identität sichtbar', async ({ page }) => {
  await page.goto(`/session/default/${yesterday()}/results`);

  await expect(page.getByRole('heading', { name: 'Heutige Ergebnisse' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Alice Host' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Bob Spieler' })).toBeVisible();
});

// ── Results: own row highlighted when identity matches a participant ──────────

test('vergangene Session Ergebnisse — eigene Zeile hervorgehoben', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({
        playerId: 'b0000000-0000-0000-0000-000000000002',
        companyId: 'default',
        displayName: 'Bob Spieler',
      }),
    );
  });

  await page.goto(`/session/default/${yesterday()}/results`);

  await expect(page.getByRole('row', { name: 'Bob Spieler' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(page.getByRole('row', { name: 'Alice Host' })).not.toHaveAttribute('aria-current');
});
