import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { HostSetupStore } from './host-setup.store';

@Component({
  selector: 'app-host-setup',
  imports: [MatButton],
  templateUrl: './host-setup.html',
  styleUrl: './host-setup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostSetup {
  protected store = inject(HostSetupStore);

  protected readonly q1Preview = signal<string | null>(null);
  protected readonly q2Preview = signal<string | null>(null);

  protected onQ1Change(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.store.selectQ1(file);
      this.q1Preview.set(URL.createObjectURL(file));
    }
  }

  protected onQ2Change(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.store.selectQ2(file);
      this.q2Preview.set(URL.createObjectURL(file));
    }
  }
}
