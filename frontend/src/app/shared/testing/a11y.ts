import axe from 'axe-core';

function checkNoNativeDisabledButtons(container: Element): string | null {
  const buttons = Array.from(
    container.querySelectorAll<HTMLElement>('button[disabled], [role="button"][disabled]'),
  );
  if (buttons.length === 0) return null;
  const els = buttons.map((el) => `    ${el.outerHTML}`).join('\n');
  return `Buttons with native disabled attribute found (use aria-disabled="true" to keep them keyboard-reachable):\n\n${els}`;
}

export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container);
  const parts: string[] = [];

  if (results.violations.length > 0) {
    const detail = results.violations
      .map((v) => {
        const nodes = v.nodes.map((n) => `    ${n.html}`).join('\n');
        return `  [${v.id}] ${v.description}\n${nodes}`;
      })
      .join('\n\n');
    parts.push(`Accessibility violations found:\n\n${detail}`);
  }

  const disabledButtonError = checkNoNativeDisabledButtons(container);
  if (disabledButtonError) parts.push(disabledButtonError);

  if (parts.length > 0) throw new Error(parts.join('\n\n'));
}
