import { Injectable, inject } from '@angular/core';
import { EntryStore } from './entry.store';

@Injectable({ providedIn: 'root' })
export class EntryContext {
  readonly playerId = inject(EntryStore).playerId;
  readonly displayName = inject(EntryStore).displayName;
}
