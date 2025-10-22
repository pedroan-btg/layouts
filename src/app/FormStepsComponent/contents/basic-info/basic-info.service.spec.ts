import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BasicInfoService } from './basic-info.service';
import type { Contrato, ContratosApiResponse, TipoBaixa } from './models';

describe('BasicInfoService', () => {
  let service: BasicInfoService;
  let httpMock: HttpTestingController;

  const mockContratosApiResponse: ContratosApiResponse = {
    data: [
      {
        id: '1',
        chave: 'CHAVE001',
        operacao: 'OP001',
        vinculoTrade: 'VT001',
        acao: 'COMPRA',
      },
      {
        id: '2',
        chave: 'CHAVE002',
        operacao: 'OP002',
        vinculoTrade: 'VT002',
        acao: 'VENDA',
      },
    ],
    total: 2,
    page: 1,
    pageSize: 12,
  };

  const mockContrato: Contrato = {
    id: '1',
    chave: 'CHAVE001',
    operacao: 'OP001',
    vinculoTrade: 'VT001',
    acao: 'COMPRA',
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BasicInfoService],
    }).compileComponents();

    service = TestBed.inject(BasicInfoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(service.filtro()).toBe('');
    expect(service.apenasNaoVinculados()).toBe(false);
    expect(service.tiposBaixa).toEqual([
      { label: 'Manual', value: 'manual' },
      { label: 'Automática', value: 'automatica' },
    ]);
  });

  it('should have correct tiposBaixa array', () => {
    const expectedTiposBaixa: TipoBaixa[] = [
      { label: 'Manual', value: 'manual' },
      { label: 'Automática', value: 'automatica' },
    ];
    expect(service.tiposBaixa).toEqual(expectedTiposBaixa);
  });

  describe('searchContratos', () => {
    it('should search contratos with correct parameters and update observables', () => {
      const filtro = 'test';
      const apenasNaoVinculados = true;
      const page = 1;
      const pageSize = 12;

      service.searchContratos(filtro, apenasNaoVinculados, page, pageSize);

      const req = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === filtro &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });

      expect(req.request.method).toBe('GET');

      req.flush(mockContratosApiResponse);

      // Test observables after response
      let contratos: Contrato[] = [];
      let total = 0;
      let currentPage = 0;
      let currentPageSize = 0;
      let loading = true;

      service.contratos$.subscribe(c => (contratos = c));
      service.total$.subscribe(t => (total = t));
      service.page$.subscribe(p => (currentPage = p));
      service.pageSize$.subscribe(ps => (currentPageSize = ps));
      service.loading$.subscribe(l => (loading = l));

      expect(contratos).toEqual(mockContratosApiResponse.data);
      expect(total).toBe(2);
      expect(currentPage).toBe(1);
      expect(currentPageSize).toBe(12);
      expect(loading).toBe(false);
      expect(service.filtro()).toBe(filtro);
      expect(service.apenasNaoVinculados()).toBe(apenasNaoVinculados);
    });

    it('should handle loading more data (page > 1) with same filters', () => {
      // First search
      service.searchContratos('test', false, 1, 12);
      const req1 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });
      req1.flush(mockContratosApiResponse);

      // Second search (page 2)
      service.searchContratos('test', false, 2, 12);
      const req2 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '2' &&
          request.params.get('pageSize') === '12'
        );
      });
      req2.flush({
        data: [
          {
            id: '3',
            chave: 'CHAVE003',
            operacao: 'OP003',
            vinculoTrade: 'VT003',
            acao: 'COMPRA',
          },
        ],
        total: 3,
        page: 2,
        pageSize: 12,
      });

      let contratos: Contrato[] = [];
      service.contratos$.subscribe(c => (contratos = c));

      expect(contratos.length).toBe(3);
      expect(contratos[2].id).toBe('3');
    });

    it('should reset data when filters change', () => {
      // First search
      service.searchContratos('filter1', false, 1, 12);
      const req1 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'filter1' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });
      req1.flush(mockContratosApiResponse);

      // Second search with different filter (should reset data)
      service.searchContratos('filter2', false, 1, 12);
      const req2 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'filter2' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });
      req2.flush({
        data: [
          {
            id: '3',
            chave: 'CHAVE003',
            operacao: 'OP003',
            vinculoTrade: 'VT003',
            acao: 'VENDA',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 12,
      });

      let contratos: Contrato[] = [];
      service.contratos$.subscribe(c => (contratos = c));

      expect(contratos.length).toBe(1);
      expect(contratos[0].id).toBe('3');
    });

    it('should handle HTTP error and reset data', () => {
      service.searchContratos('test', false, 1, 12);

      const req = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });

      req.error(new ErrorEvent('Network error'));

      let contratos: Contrato[] = [];
      let total = 0;
      let loading = true;

      service.contratos$.subscribe(c => (contratos = c));
      service.total$.subscribe(t => (total = t));
      service.loading$.subscribe(l => (loading = l));

      expect(contratos).toEqual([]);
      expect(total).toBe(0);
      expect(loading).toBe(false);
    });

    it('should set loading to true during request', () => {
      const loadingStates: boolean[] = [];
      service.loading$.subscribe(loading => loadingStates.push(loading));

      service.searchContratos('test', false, 1, 12);

      expect(loadingStates).toContain(true);

      const req = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });

      req.flush(mockContratosApiResponse);

      expect(loadingStates).toContain(false);
    });

    it('should call searchContratos with current filters and new page', () => {
      // First search to set initial state
      service.searchContratos('test', true, 1, 12);
      const req1 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });
      req1.flush(mockContratosApiResponse);

      // Change page
      service.changePage(2);
      const req2 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '2' &&
          request.params.get('pageSize') === '12'
        );
      });
      req2.flush(mockContratosApiResponse);

      let currentPage = 0;
      service.page$.subscribe(p => (currentPage = p));

      expect(currentPage).toBe(2);
    });

    it('should call searchContratos with current filters, page 1, and new pageSize', () => {
      // First search to set initial state
      service.searchContratos('test', true, 2, 12);
      const req1 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '2' &&
          request.params.get('pageSize') === '12'
        );
      });
      req1.flush(mockContratosApiResponse);

      // Change page size
      service.changePageSize(20);
      const req2 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '20'
        );
      });
      req2.flush(mockContratosApiResponse);

      let currentPage = 0;
      let currentPageSize = 0;
      service.page$.subscribe(p => (currentPage = p));
      service.pageSize$.subscribe(ps => (currentPageSize = ps));

      expect(currentPage).toBe(1);
      expect(currentPageSize).toBe(20);
    });

    it('should increment current page and call changePage', () => {
      // First search to set initial state
      service.searchContratos('test', true, 1, 12);
      const req1 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });
      req1.flush(mockContratosApiResponse);

      // Load next page
      service.loadNextPage();
      const req2 = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '2' &&
          request.params.get('pageSize') === '12'
        );
      });
      req2.flush(mockContratosApiResponse);

      let currentPage = 0;
      service.page$.subscribe(p => (currentPage = p));

      expect(currentPage).toBe(2);
    });

    it('should return current page value', () => {
      // First search to set page
      service.searchContratos('test', false, 3, 12);
      const req = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '3' &&
          request.params.get('pageSize') === '12'
        );
      });
      req.flush(mockContratosApiResponse);

      const currentPage = service.getCurrentPage();
      expect(currentPage).toBe(3);
    });

    it('should return default page value when no search has been performed', () => {
      const currentPage = service.getCurrentPage();
      expect(currentPage).toBe(1);
    });

    it('should update filtro signal', () => {
      service.searchContratos('test-filter', false, 1, 12);
      const req = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test-filter' &&
          request.params.get('apenasNaoVinculados') === 'false' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });
      req.flush(mockContratosApiResponse);

      const filtroValue = service.filtro();
      expect(filtroValue).toBe('test-filter');
    });

    it('should update apenasNaoVinculados signal', () => {
      service.searchContratos('test', true, 1, 12);
      const req = httpMock.expectOne(request => {
        return (
          request.url === '/api/contratos' &&
          request.params.get('filtro') === 'test' &&
          request.params.get('apenasNaoVinculados') === 'true' &&
          request.params.get('page') === '1' &&
          request.params.get('pageSize') === '12'
        );
      });
      req.flush(mockContratosApiResponse);

      const apenasNaoVinculadosValue = service.apenasNaoVinculados();
      expect(apenasNaoVinculadosValue).toBe(true);
    });
  });

  describe('selectContrato', () => {
    it('should update selectedContrato observable', () => {
      service.selectContrato(mockContrato);

      let selected: Contrato | null = null;
      service.selectedContrato$.subscribe(s => (selected = s));

      expect(selected).toEqual(mockContrato);
    });
  });

  describe('clearSelection', () => {
    it('should clear selectedContrato observable', () => {
      // First select a contract
      service.selectContrato(mockContrato);

      // Then clear selection
      service.clearSelection();

      let selected: Contrato | null = mockContrato;
      service.selectedContrato$.subscribe(s => (selected = s));

      expect(selected).toBeNull();
    });
  });
});
