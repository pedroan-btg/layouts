import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';
import contractsData from '../../../core/mocks/contracts.json';

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
    console.log('🔄 Interceptando requisição:', req.url);
    console.log('📋 Parâmetros:', req.params);

    // Extrai parâmetros da query
    const filtro = req.params.get('filtro') || '';
    const apenasNaoVinculados = req.params.get('apenasNaoVinculados') === 'true';
    const page = parseInt(req.params.get('page') || '1');
    const pageSize = parseInt(req.params.get('pageSize') || '12');

    // Usa os dados do arquivo JSON
    let dataToFilter: ContratoApi[] = contractsData as ContratoApi[];

    console.log(`📊 Total de contratos disponíveis: ${dataToFilter.length}`);

    // Aplica filtros
    if (filtro.trim()) {
      dataToFilter = dataToFilter.filter(contrato =>
        contrato.chave.toLowerCase().includes(filtro.toLowerCase()) ||
        contrato.operacao.toLowerCase().includes(filtro.toLowerCase())
      );
      console.log(`🔍 Após filtro por texto "${filtro}": ${dataToFilter.length} contratos`);
    }

    if (apenasNaoVinculados) {
      dataToFilter = dataToFilter.filter(contrato => contrato.vinculoTrade === 'Não');
      console.log(`🔗 Após filtro "apenas não vinculados": ${dataToFilter.length} contratos`);
    }

    // Calcula paginação
    const total = dataToFilter.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = dataToFilter.slice(startIndex, endIndex);

    console.log(`📄 Página ${page}, mostrando ${paginatedData.length} de ${total} contratos`);

    // Monta resposta
    const response: ContratosApiResponse = {
      data: paginatedData,
      total: total,
      page: page,
      pageSize: pageSize
    };

    console.log('✅ Resposta mock gerada:', response);

    // Simula delay de rede e retorna resposta
    return of(new HttpResponse({
      status: 200,
      body: response
    })).pipe(delay(2000)); // Delay de 2 segundos para simular carregamento
  }

  // Para outras requisições, continua normalmente
  return next(req);
};