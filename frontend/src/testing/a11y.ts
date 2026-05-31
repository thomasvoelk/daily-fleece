import axe from 'axe-core';

export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container);
  if (results.violations.length === 0) return;

  const detail = results.violations
    .map((v) => `  [${v.id}] ${v.description}\n${v.nodes.map((n) => `    ${n.html}`).join('\n')}`)
    .join('\n\n');

  throw new Error(`Accessibility violations found:\n\n${detail}`);
}
