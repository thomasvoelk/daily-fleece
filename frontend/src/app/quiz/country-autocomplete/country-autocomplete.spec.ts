import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideTestEnvironment } from '../../shared/testing';
import { CountryAutocomplete } from './country-autocomplete';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

async function renderComponent(onSelected?: (code: string) => void) {
  return render(CountryAutocomplete, {
    providers: [...provideTestEnvironment()],
    on: { countrySelected: onSelected ?? noop },
  });
}

// ─── tracer bullet ────────────────────────────────────────────────────────────

describe('CountryAutocomplete', () => {
  it('renders a combobox labeled "Your answer" by default', async () => {
    await renderComponent();
    screen.getByRole('combobox', { name: /your answer/i });
  });

  it('typing filters the options to matching countries', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const input = screen.getByRole('combobox', { name: /your answer/i });
    await user.click(input);
    await user.type(input, 'deutsch');

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.textContent.toLowerCase().includes('deutsch'))).toBe(true);
  });

  it('selecting a country emits its ISO code via countrySelected', async () => {
    const user = userEvent.setup();
    const onSelected = vi.fn();
    await renderComponent(onSelected);

    const input = screen.getByRole('combobox', { name: /your answer/i });
    await user.click(input);
    await user.type(input, 'deutsch');
    await user.click(screen.getAllByRole('option')[0]);

    expect(onSelected).toHaveBeenCalledWith('DE');
  });
});
