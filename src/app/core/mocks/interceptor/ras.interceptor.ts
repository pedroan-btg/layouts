import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import rasData from '../json/ras.json';

// A tipagem completa do RAS será definida em basic-info/models.ts.
// Aqui usamos um tipo mínimo para o body do mock.
export const rasMockInterceptor: HttpInterceptorFn = (req, next) => {
  // Intercepta chamadas ao endpoint externo de deals do RAS
  if (
    req.url.includes('/RAS-API/External/core/workflow/deals/') ||
    req.url.includes('/workflow/deals/')
  ) {
    // Opcional: extrair o id do deal, se necessário
    // const match = req.url.match(/deals\/(\d+)/);

    // Simula uma resposta de sucesso com delay
    return of(
      new HttpResponse({
        status: 200,
        body: rasData,
      }),
    ).pipe(delay(1500));
  }

  // Demais requisições seguem normalmente
  return next(req);
};
