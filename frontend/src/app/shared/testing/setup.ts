import '@testing-library/jest-dom/vitest';
import { loadTranslations } from '@angular/localize';
import { readFileSync } from 'fs';
import { Xliff1TranslationParser } from '@angular/localize/tools';

const xliffContent = readFileSync('src/locale/messages.de.xlf', 'utf-8');
const parser = new Xliff1TranslationParser();
const analysis = parser.analyze('src/locale/messages.de.xlf', xliffContent);
if (!analysis.canParse) {
  throw new Error('Cannot parse messages.de.xlf');
}
const { translations } = parser.parse('src/locale/messages.de.xlf', xliffContent, analysis.hint);

interface ParsedEntry {
  messageParts: TemplateStringsArray;
  placeholderNames: string[];
}
const cookedTranslations: Record<string, string> = {};
for (const [id, raw] of Object.entries(translations)) {
  const parsed = raw as unknown as ParsedEntry;
  const parts = parsed.messageParts;
  const names = parsed.placeholderNames;
  let cooked: string = parts[0];
  for (let i = 0; i < names.length; i++) {
    cooked += `{$${names[i]}}` + parts[i + 1];
  }
  cookedTranslations[id] = cooked;
}

loadTranslations(cookedTranslations);

// JSDOM doesn't implement the Canvas API. Angular CDK probes for canvas capabilities
// during component rendering, which produces "Not implemented: HTMLCanvasElement.getContext"
// noise in every test run. Stub it out so the warnings are suppressed.
HTMLCanvasElement.prototype.getContext = () => null;
