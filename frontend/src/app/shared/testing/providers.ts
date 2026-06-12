import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TODAY } from '..';

export function provideTestEnvironment() {
  return [
    provideHttpClient(withXhr()),
    provideHttpClientTesting(),
    { provide: TODAY, useValue: '2026-06-12' },
  ];
}
