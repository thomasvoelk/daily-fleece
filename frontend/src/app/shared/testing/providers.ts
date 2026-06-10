import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

export function provideTestEnvironment() {
  return [provideHttpClient(withXhr()), provideHttpClientTesting()];
}
