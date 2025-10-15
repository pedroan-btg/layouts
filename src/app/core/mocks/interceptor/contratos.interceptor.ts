import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import contractsData from '../json/contracts.json';

export interface ContratoApi {
  id: string;
  chave: string;
  operacao: string;
  vinculoTrade: string;
  acao: string;
}

export interface ContratosApiResponse {
  data: ContratoApi[];
  total: number;
  page: number;
  pageSize: number;
}

export const contratosMockInterceptor: HttpInterceptorFn = (req, next) => {
  // Intercepta apenas requisições para /api/contratos
  if (req.url.includes('/api/contratos')) {
    // Extrai parâmetros da query
    const filtro = req.params.get('filtro') || '';
    const apenasNaoVinculados = req.params.get('apenasNaoVinculados') === 'true';
    const page = parseInt(req.params.get('page') || '1');
    const pageSize = parseInt(req.params.get('pageSize') || '12');

    // Usa os dados do arquivo JSON
    let dataToFilter: ContratoApi[] = contractsData as ContratoApi[];

    // Aplica filtros
    if (filtro.trim()) {
      dataToFilter = dataToFilter.filter(
        contrato =>
          contrato.chave.toLowerCase().includes(filtro.toLowerCase()) ||
          contrato.operacao.toLowerCase().includes(filtro.toLowerCase()),
      );
    }

    if (apenasNaoVinculados) {
      dataToFilter = dataToFilter.filter(contrato => contrato.vinculoTrade === 'Não');
    }

    // Calcula paginação
    const total = dataToFilter.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = dataToFilter.slice(startIndex, endIndex);

    // Monta resposta
    const response: ContratosApiResponse = {
      data: paginatedData,
      total: total,
      page: page,
      pageSize: pageSize,
    };

    // Simula delay de rede e retorna resposta
    return of(
      new HttpResponse({
        status: 200,
        body: response,
      }),
    ).pipe(delay(2000)); // Delay de 2 segundos para simular carregamento
  }

  // Para outras requisições, continua normalmente
  return next(req);
};
