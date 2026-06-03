import { render } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { expectNoA11yViolations } from './shared/testing';

describe('App – a11y', () => {
  it('has no axe violations', async () => {
    const { container } = await render(App, { providers: [provideRouter([])] });
    await expectNoA11yViolations(container);
  });
});
