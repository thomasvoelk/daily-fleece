import { TestBed } from '@angular/core/testing';
import { EntryContext } from './entry-context';
import { EntryStore } from './entry.store';
import { provideTestEnvironment, mockLocalStorage } from '../shared/testing';
import { provideRouter } from '@angular/router';

mockLocalStorage();

const PROVIDERS = [...provideTestEnvironment(), provideRouter([]), EntryStore];

describe('EntryContext – displayName', () => {
  it('reflects the displayName stored in EntryStore', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p42', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const ctx = TestBed.inject(EntryContext);

    expect(ctx.displayName()).toBe('Alice');
  });

  it('is null when no player is stored', () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const ctx = TestBed.inject(EntryContext);

    expect(ctx.displayName()).toBeNull();
  });
});

describe('EntryContext – playerId', () => {
  it('reflects the playerId stored in EntryStore', () => {
    localStorage.setItem(
      'lobby-player',
      JSON.stringify({ playerId: 'p42', companyId: 'acme', displayName: 'Alice' }),
    );
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const ctx = TestBed.inject(EntryContext);

    expect(ctx.playerId()).toBe('p42');
  });

  it('is null when no player is stored', () => {
    TestBed.configureTestingModule({ providers: PROVIDERS });
    const ctx = TestBed.inject(EntryContext);

    expect(ctx.playerId()).toBeNull();
  });
});
