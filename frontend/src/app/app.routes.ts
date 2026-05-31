import { Routes } from '@angular/router';
import { Entry } from './entry/entry';
import { Lobby } from './lobby/lobby';
import { HostSetup } from './host-setup/host-setup';
import { hasPlayerIdGuard } from './host-setup/host-setup.guard';

export const routes: Routes = [
  { path: '', component: Entry },
  { path: 'lobby', component: Lobby },
  { path: 'host', component: HostSetup, canActivate: [hasPlayerIdGuard] },
];
