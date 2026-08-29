import { CountryList } from './country-list';

describe('CountryList', () => {
  let service: CountryList;

  beforeEach(() => {
    service = new CountryList();
  });

  describe('all()', () => {
    it('returns all countries', () => {
      expect(service.all().length).toBeGreaterThan(200);
    });

    it('returns countries sorted alphabetically by German name', () => {
      const names = service.all().map((c) => c.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b, 'de'));
      expect(names).toEqual(sorted);
    });

    it('each entry has a code and a name', () => {
      for (const c of service.all()) {
        expect(c.code).toBeTruthy();
        expect(c.name).toBeTruthy();
      }
    });
  });

  describe('filter()', () => {
    it('returns all countries when query is empty', () => {
      expect(service.filter('').length).toBe(service.all().length);
    });

    it('filters by substring match on name', () => {
      const results = service.filter('deutsch');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((c) => c.name.toLowerCase().includes('deutsch'))).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(service.filter('DEUTSCH').length).toBe(service.filter('deutsch').length);
    });

    it('returns empty array when nothing matches', () => {
      expect(service.filter('zzznomatch')).toHaveLength(0);
    });
  });

  describe('nameOf()', () => {
    it('returns the German display name for a known ISO code', () => {
      expect(service.nameOf('DE')).toBe('Deutschland');
    });

    it('returns the code itself as fallback for an unknown code', () => {
      expect(service.nameOf('UNKNOWN')).toBe('UNKNOWN');
    });

    it('falls back to the ISO code when Intl.DisplayNames returns no name for it', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- called via .call() below with an explicit `this`
      const original = Intl.DisplayNames.prototype.of;
      vi.spyOn(Intl.DisplayNames.prototype, 'of').mockImplementation(function (
        this: Intl.DisplayNames,
        code: string,
      ) {
        return code === 'DE' ? undefined : original.call(this, code);
      });

      const fallbackService = new CountryList();
      expect(fallbackService.nameOf('DE')).toBe('DE');

      vi.restoreAllMocks();
    });
  });
});
