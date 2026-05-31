import { render } from '@testing-library/angular';
import { signal } from '@angular/core';
import type { FieldState } from '@angular/forms/signals';
import { FieldError } from './field-error';

function makeState(opts: {
  touched: boolean;
  invalid: boolean;
  errors: unknown[];
}): FieldState<unknown> {
  return {
    touched: signal(opts.touched),
    invalid: signal(opts.invalid),
    errors: signal(opts.errors),
  } as unknown as FieldState<unknown>;
}

describe('FieldError', () => {
  it('renders a non-empty fallback when the validator error has no message property', async () => {
    const state = makeState({ touched: true, invalid: true, errors: [{ kind: 'custom' }] });
    const { container } = await render(FieldError, { inputs: { state, id: 'test-error' } });

    const span = container.querySelector('#test-error');
    expect(span).toBeTruthy();
    expect(span!.textContent!.trim()).not.toBe('');
  });

  it('renders nothing when the field is untouched', async () => {
    const state = makeState({
      touched: false,
      invalid: true,
      errors: [{ kind: 'required', message: 'Required' }],
    });
    const { container } = await render(FieldError, { inputs: { state, id: 'test-error' } });

    expect(container.querySelector('#test-error')).toBeNull();
  });
});
