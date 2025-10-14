import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ENV_CONFIG } from 'fts-frontui/env';
import { contratosMockInterceptor } from './FormStepsComponent/mockBackEndInterceptor/contratos-mock.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([contratosMockInterceptor])),
    importProvidersFrom(NgbModule),
    { provide: ENV_CONFIG, useValue: { environment: 'production', version: '0.0.0', logDisabled: true } }
  ]
};
