import { render } from '@testing-library/angular';
import { App } from './app';
import { expectNoA11yViolations } from '../testing/a11y';

describe('App – a11y', () => {
  it('has no axe violations', async () => {
    const { container } = await render(App);
    await expectNoA11yViolations(container);
  });
});
