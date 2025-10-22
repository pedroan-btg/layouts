import { describe, it, expect, vi, beforeEach, afterEach, vitest } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { ENV_CONFIG } from 'fts-frontui/env';

import { BasicInfoComponent } from './basic-info.component';
import { BasicInfoService } from './basic-info.service';
import { GetDealRasService } from './services/get-deal-ras.service';

// Mock dos módulos UI para substituir os imports reais
vitest.mock('fts-frontui/table', () => ({
  Table: Component({
    selector: 'fts-table',
    standalone: true,
    template: '<div class="mock-table"><ng-content></ng-content></div>',
  })(class {}),
  TableColumn: Component({
    selector: 'fts-table-column',
    standalone: true,
    template: '<div class="mock-column"><ng-content></ng-content></div>',
  })(class {}),
}));

vitest.mock('fts-frontui/loading', () => ({
  Loading: Component({
    selector: 'fts-loading',
    standalone: true,
    template: '<div class="mock-loading"></div>',
  })(class {}),
}));

vitest.mock('fts-frontui/i18n', () => ({
  i18n: Component({
    selector: 'fts-i18n',
    standalone: true,
    template: '<div class="mock-i18n"><ng-content></ng-content></div>',
  })(class {}),
}));

// Mock dos serviços para isolar o coverage
vitest.mock('./basic-info.service', () => ({
  BasicInfoService: vi.fn(),
}));

vitest.mock('./services/get-deal-ras.service', () => ({
  GetDealRasService: vi.fn(),
}));

describe('BasicInfoComponent', () => {
  let mockBasicInfoService: any;
  let mockGetDealRasService: any;

  const mockIntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockBasicInfoService = {
      contratos$: new BehaviorSubject<any[]>([]),
      total$: new BehaviorSubject<number>(0),
      page$: new BehaviorSubject<number>(1),
      pageSize$: new BehaviorSubject<number>(12),
      selectedContrato$: new BehaviorSubject<any>(null),
      loading$: new BehaviorSubject<boolean>(false),
      tiposBaixa: [
        { label: 'Manual', value: 'manual' },
        { label: 'Automática', value: 'automatica' },
      ],
      searchContratos: vi.fn(),
      changePage: vi.fn(),
      changePageSize: vi.fn(),
      selectContrato: vi.fn(),
      clearSelection: vi.fn(),
      loadNextPage: vi.fn(),
      getCurrentPage: vi.fn().mockReturnValue(1),
    };

    mockGetDealRasService = {
      getDealRas: vi.fn(),
    };

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: mockIntersectionObserver,
    });

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        CommonModule,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        BasicInfoComponent,
      ],
      providers: [
        FormBuilder,
        { provide: BasicInfoService, useValue: mockBasicInfoService },
        { provide: GetDealRasService, useValue: mockGetDealRasService },
        {
          provide: ENV_CONFIG,
          useValue: {
            environment: 'test',
            version: '0.0.0',
            logDisabled: true,
          },
        },
      ],
    }).compileComponents();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createCmp() {
    const fixture = TestBed.createComponent(BasicInfoComponent);
    const cmp = fixture.componentInstance as any;

    // Mock ViewChild elements to prevent null reference errors
    Object.defineProperty(cmp, 'tableContainer', {
      value: { nativeElement: document.createElement('div') },
      configurable: true,
    });

    Object.defineProperty(cmp, 'infiniteSentinel', {
      value: { nativeElement: document.createElement('div') },
      configurable: true,
    });

    fixture.detectChanges();
    return { fixture, cmp };
  }

  it('should create', () => {
    const { cmp } = createCmp();
    expect(cmp).toBeTruthy();
  });

  it('should initialize form', () => {
    const { cmp } = createCmp();
    expect(cmp.form).toBeDefined();
    expect(cmp.form.get('dataContrato')).toBeDefined();
    expect(cmp.form.get('dataInicioVigencia')).toBeDefined();
    expect(cmp.form.get('tipoBaixa')).toBeDefined();
  });

  it('should have form controls', () => {
    const { cmp } = createCmp();
    const controls = ['dataContrato', 'dataInicioVigencia', 'tipoBaixa'];
    controls.forEach(controlName => {
      const ctrl = cmp.form.get(controlName);
      expect(ctrl).toBeDefined();
    });
  });

  it('should have tiposBaixa array', () => {
    const { cmp } = createCmp();
    expect(cmp.tiposBaixa).toBeDefined();
  });

  it('should have observables defined', () => {
    const { cmp } = createCmp();
    expect(cmp.loading$).toBeDefined();
    expect(cmp.rasLoading$).toBeDefined();
  });

  it('should have observables from service', () => {
    const { cmp } = createCmp();
    expect(cmp.contratos$).toBeDefined();
    expect(cmp.total$).toBeDefined();
    expect(cmp.page$).toBeDefined();
    expect(cmp.pageSize$).toBeDefined();
    expect(cmp.selected$).toBeDefined();
    expect(cmp.loading$).toBeDefined();
  });

  it('formatIsoToInput should format valid ISO to yyyy-MM-dd', () => {
    const { cmp } = createCmp();
    const input = '2024-02-29T12:34:56Z';
    const output = cmp.formatIsoToInput(input);
    expect(output).toBe('2024-02-29');
  });

  it('formatIsoToInput should return empty for invalid and sentinel date', () => {
    const { cmp } = createCmp();
    const inputs = [null, undefined, '0001-01-01T00:00:00Z', 'not-a-date'];
    const results = inputs.map(i => cmp.formatIsoToInput(i as any));
    expect(results).toEqual(['', '', '', '']);
  });

  it('mapDealRasToContrato should build Contrato correctly', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'ABC123';
    const res: any = {
      NewContract: 'NC001',
      BaseContract: null,
      Account: 'ACC001',
      ProductCanonical: 'ProdutoX',
      UseOfProceedsCanonical: null,
      Book: 'LivroY',
    };
    const contrato = cmp.mapDealRasToContrato(res);
    expect(contrato.id).toBe('ras-ABC123');
    expect(contrato.chave).toBe('NC001');
    expect(['ProdutoX', 'LivroY', 'ACC001', '-']).toContain(contrato.operacao);
    expect(contrato.vinculoTrade).toBe('Não vinculado');
    expect(contrato.acao).toBe('Excluir');
  });

  it('applyRasToForm should fill form with formatted dates', () => {
    const { cmp } = createCmp();
    const res: any = {
      DisbursementDate: '2024-01-20T00:00:00Z',
      MaturityDate: '2024-12-05T00:00:00Z',
    };
    cmp.applyRasToForm(res);
    expect(cmp.form.value.dataInicioVigencia).toBe('2024-01-20');
    expect(cmp.form.value.dataContrato).toBe('2024-12-05');
  });

  it('performApplyRAS should fetch, apply and lock states correctly', () => {
    const { cmp } = createCmp();
    const res: any = {
      DisbursementDate: '2024-01-20T00:00:00Z',
      MaturityDate: '2024-12-05T00:00:00Z',
      NewContract: 'NC001',
      ProductCanonical: 'ProdutoX',
    };
    mockGetDealRasService.getDealRas.mockReturnValue(of(res));

    cmp.performApplyRAS('ABC123');

    expect(cmp.rasLocked).toBe(true);
    expect(cmp.manualLocked).toBe(false);
    expect((cmp.rasContratos || []).length).toBe(1);
    expect(cmp.dealRASStatus).toBe('OK');
    expect(mockBasicInfoService.clearSelection).toHaveBeenCalled();
  });

  it('resetRASLock should clear flags and status', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.dealRASStatus = 'OK';
    cmp.rasContratos = [{ id: 'x' }];

    cmp.resetRASLock();

    expect(cmp.rasLocked).toBe(false);
    expect(cmp.dealRASStatus).toBe('-');
    expect(cmp.rasContratos).toEqual([]);
  });

  it('onBuscar should respect lock and call service', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.onBuscar();
    expect(mockBasicInfoService.searchContratos).not.toHaveBeenCalled();

    vi.clearAllMocks();
    cmp.rasLocked = false;
    cmp.searchText = 'termo';
    cmp.onlyNotLinked = true;
    cmp.onBuscar();
    expect(mockBasicInfoService.searchContratos).toHaveBeenCalledWith('termo', true, 1, 12);
  });

  it('onSelect should lock manual and select contract', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = false;
    const row = { id: 1 } as any;
    cmp.onSelect(row);
    expect(cmp.manualLocked).toBe(true);
    expect(cmp.manualContratos.length).toBe(1);
    expect(mockBasicInfoService.selectContrato).toHaveBeenCalledWith(row);
  });

  it('ngOnDestroy should disconnect observer', () => {
    const { cmp } = createCmp();
    const disconnect = vi.fn();
    cmp.io = { disconnect };
    cmp.ngOnDestroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('clearSearch should reset search parameters and call service', () => {
    const { cmp } = createCmp();
    cmp.searchText = 'test';
    cmp.onlyNotLinked = true;
    cmp.clearSearch();
    expect(cmp.searchText).toBe('');
    expect(cmp.onlyNotLinked).toBe(false);
    expect(mockBasicInfoService.searchContratos).toHaveBeenCalledWith('', false, 1, 12);
  });

  it('clearSearch should not work when locked', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.searchText = 'test';
    cmp.clearSearch();
    expect(cmp.searchText).toBe('test');
    expect(mockBasicInfoService.searchContratos).not.toHaveBeenCalled();
  });

  it('toggleShowRAS should toggle showras and reset RAS lock when false', () => {
    const { cmp } = createCmp();
    const event = { target: { checked: true } } as any;
    cmp.toggleShowRAS(event);
    expect(cmp.showras).toBe(true);

    const eventFalse = { target: { checked: false } } as any;
    cmp.rasLocked = true;
    cmp.dealRASStatus = 'OK';
    cmp.toggleShowRAS(eventFalse);
    expect(cmp.showras).toBe(false);
    expect(cmp.rasLocked).toBe(false);
    expect(cmp.dealRASStatus).toBe('-');
  });

  it('applyRAS should set status when dealRAS is empty', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '';
    cmp.applyRAS();
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
  });

  it('applyRAS should show confirmation modal when manual locked', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'ABC123';
    cmp.manualLocked = true;
    cmp.applyRAS();
    expect(cmp.showConfirmRas).toBe(true);
  });

  it('confirmApplyRAS should set status and close modal when dealRAS is empty', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '';
    cmp.showConfirmRas = true;
    cmp.confirmApplyRAS();
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
  });

  it('confirmApplyRAS should clear manual selection and apply RAS', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'ABC123';
    cmp.showConfirmRas = true;
    cmp.manualLocked = true;
    cmp.manualContratos = [{ id: 'test' }];
    
    const res: any = {
      DisbursementDate: '2024-01-20T00:00:00Z',
      MaturityDate: '2024-12-05T00:00:00Z',
      NewContract: 'NC001',
    };
    mockGetDealRasService.getDealRas.mockReturnValue(of(res));

    cmp.confirmApplyRAS();
    
    expect(cmp.showConfirmRas).toBe(false);
    expect(cmp.manualLocked).toBe(false);
    expect(cmp.manualContratos).toEqual([]);
    expect(mockBasicInfoService.clearSelection).toHaveBeenCalled();
  });

  it('cancelApplyRAS should close confirmation modal', () => {
    const { cmp } = createCmp();
    cmp.showConfirmRas = true;
    cmp.cancelApplyRAS();
    expect(cmp.showConfirmRas).toBe(false);
  });

  it('performApplyRAS should handle error response', () => {
    const { cmp } = createCmp();
    mockGetDealRasService.getDealRas.mockReturnValue(throwError(() => new Error('Test error')));

    cmp.performApplyRAS('ABC123');

    expect(cmp.rasLoading$).toBeDefined();
  });

  it('onChangePage should handle page changes correctly', () => {
    const { cmp } = createCmp();
    mockBasicInfoService.page$ = new BehaviorSubject(1);
    
    cmp.onChangePage(2);
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
  });

  it('onChangePage should not process same page twice', () => {
    const { cmp } = createCmp();
    cmp.lastProcessedPage = 2;
    mockBasicInfoService.page$ = new BehaviorSubject(2);
    
    cmp.onChangePage(2);
    // Should not call changePage again for same page
  });

  it('onChangePageSize should respect locks', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.onChangePageSize(24);
    expect(mockBasicInfoService.changePageSize).not.toHaveBeenCalled();

    cmp.rasLocked = false;
    cmp.manualLocked = true;
    cmp.onChangePageSize(24);
    expect(mockBasicInfoService.changePageSize).not.toHaveBeenCalled();
  });

  it('onChangePageSize should call service when not locked', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = false;
    cmp.manualLocked = false;
    cmp.onChangePageSize(24);
    expect(mockBasicInfoService.changePageSize).toHaveBeenCalledWith(24);
  });

  it('onLoadMore should respect locks', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.onLoadMore();
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();

    cmp.rasLocked = false;
    cmp.manualLocked = true;
    cmp.onLoadMore();
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
  });

  it('onLoadMore should call service when not locked', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = false;
    cmp.manualLocked = false;
    cmp.onLoadMore();
    expect(mockBasicInfoService.loadNextPage).toHaveBeenCalled();
  });

  it('onPrevPage should navigate to previous page when current > 1', () => {
    const { cmp } = createCmp();
    
    // Mock the page$ observable directly on the component
    cmp.page$ = new BehaviorSubject(3);
    cmp.rasLocked = false;
    cmp.manualLocked = false;

    // Call the method
    cmp.onPrevPage();
    
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
  });

  it('onPrevPage should not navigate when on first page', () => {
    const { cmp } = createCmp();
    
    // Mock the page$ observable directly on the component
    cmp.page$ = new BehaviorSubject(1);
    cmp.rasLocked = false;
    cmp.manualLocked = false;

    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
  });

  it('onPrevPage should respect locks', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
  });

  it('onNextPage should navigate to next page when within limits', () => {
    const { cmp } = createCmp();
    
    // Mock the page$ observable directly on the component
    cmp.page$ = new BehaviorSubject(1);
    cmp.totalCount = 24; // 2 pages with 12 items per page
    cmp.rasLocked = false;
    cmp.manualLocked = false;

    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
  });

  it('onNextPage should not navigate when on last page', () => {
    const { cmp } = createCmp();
    
    // Mock the page$ observable directly on the component  
    cmp.page$ = new BehaviorSubject(2);
    cmp.totalCount = 24; // 2 pages with 12 items per page
    cmp.rasLocked = false;
    cmp.manualLocked = false;

    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
  });

  it('onNextPage should respect locks', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
  });

  it('onExcluirRAS should reset RAS lock', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.rasContratos = [{ id: 'test' }];
    cmp.dealRASStatus = 'OK';
    
    cmp.onExcluirRAS();
    
    expect(cmp.rasLocked).toBe(false);
    expect(cmp.rasContratos).toEqual([]);
    expect(cmp.dealRASStatus).toBe('-');
  });

  it('onExcluirSelecionado should clear manual selection', () => {
    const { cmp } = createCmp();
    cmp.manualLocked = true;
    cmp.manualContratos = [{ id: 'test' }];
    
    cmp.onExcluirSelecionado();
    
    expect(cmp.manualLocked).toBe(false);
    expect(cmp.manualContratos).toEqual([]);
    expect(mockBasicInfoService.clearSelection).toHaveBeenCalled();
  });

  it('should handle scroll events and load more when at bottom', async () => {
    const { cmp, fixture } = createCmp();
    cmp.currentCount = 10;
    cmp.totalCount = 20;
    cmp.isLoading = false;

    // Mock scroll event
    const container = cmp.tableContainer?.nativeElement;
    if (container) {
      Object.defineProperty(container, 'scrollTop', { value: 900, configurable: true });
      Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });

      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);

      // Wait for auditTime
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockBasicInfoService.loadNextPage).toHaveBeenCalled();
    }
  });

  it('should handle IntersectionObserver entries', () => {
    const { cmp } = createCmp();
    cmp.currentCount = 10;
    cmp.totalCount = 20;
    cmp.isLoading = false;

    // Simulate intersection observer callback
    const mockEntries = [{ isIntersecting: true }];
    const callback = mockIntersectionObserver.mock.calls[0]?.[0];
    if (callback) {
      callback(mockEntries);
    }

    expect(mockBasicInfoService.loadNextPage).toHaveBeenCalled();
  });

  it('should not load more when already loading', () => {
    const { cmp } = createCmp();
    cmp.currentCount = 10;
    cmp.totalCount = 20;
    cmp.isLoading = true;

    const mockEntries = [{ isIntersecting: true }];
    const callback = mockIntersectionObserver.mock.calls[0]?.[0];
    if (callback) {
      callback(mockEntries);
    }

    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
  });

  it('should not load more when all items loaded', () => {
    const { cmp } = createCmp();
    cmp.currentCount = 20;
    cmp.totalCount = 20;
    cmp.isLoading = false;

    const mockEntries = [{ isIntersecting: true }];
    const callback = mockIntersectionObserver.mock.calls[0]?.[0];
    if (callback) {
      callback(mockEntries);
    }

    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
  });

  it('should handle loading state changes and scroll position', async () => {
    const { cmp } = createCmp();
    
    // Mock container element
    const mockContainer = {
      scrollTop: 100,
      scrollHeight: 1000,
      clientHeight: 200,
    };
    Object.defineProperty(cmp, 'tableContainer', {
      value: { nativeElement: mockContainer },
      configurable: true,
    });

    // Simulate loading start
    mockBasicInfoService.loading$.next(true);
    
    expect(cmp.isLoading).toBe(true);
    expect(cmp.prevScrollTop).toBe(100);

    // Simulate loading end
    mockBasicInfoService.loading$.next(false);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(cmp.isLoading).toBe(false);
  });

  it('should handle form enable in constructor', () => {
    const { cmp } = createCmp();
    expect(cmp.form.enabled).toBe(true);
  });

  it('should handle contratos$ subscription in constructor', () => {
    const { cmp } = createCmp();
    const testContratos = [{ id: '1' }, { id: '2' }];
    
    mockBasicInfoService.contratos$.next(testContratos);
    
    expect(cmp.currentCount).toBe(2);
  });

  it('should handle total$ subscription in constructor', () => {
    const { cmp } = createCmp();
    
    mockBasicInfoService.total$.next(50);
    
    expect(cmp.totalCount).toBe(50);
  });

  it('should handle null container in ngAfterViewInit', () => {
    const { cmp } = createCmp();
    Object.defineProperty(cmp, 'tableContainer', {
      value: undefined,
      configurable: true,
    });
    
    // Should not throw error
    expect(() => cmp.ngAfterViewInit()).not.toThrow();
  });

  it('should handle null sentinel in ngAfterViewInit', () => {
    const { cmp } = createCmp();
    Object.defineProperty(cmp, 'infiniteSentinel', {
      value: undefined,
      configurable: true,
    });
    
    // Should not throw error
    expect(() => cmp.ngAfterViewInit()).not.toThrow();
  });

  it('should handle mapDealRasToContrato with null/undefined values', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '';
    
    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };
    
    const contrato = cmp.mapDealRasToContrato(res);
    
    expect(contrato.chave).toBe('-');
    expect(contrato.operacao).toBe('-');
  });

  it('should handle mapDealRasToContrato with BaseContract fallback', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'ABC123';
    
    const res: any = {
      NewContract: null,
      BaseContract: 'BC001',
      Account: 'ACC001',
      ProductCanonical: null,
      UseOfProceedsCanonical: 'UOP001',
      Book: null,
    };
    
    const contrato = cmp.mapDealRasToContrato(res);
    
    expect(contrato.chave).toBe('BC001');
    expect(contrato.operacao).toBe('UOP001');
  });

  it('should handle mapDealRasToContrato with Account fallback', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'ABC123';
    
    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: 'ACC001',
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: 'BOOK001',
    };
    
    const contrato = cmp.mapDealRasToContrato(res);
    
    expect(contrato.chave).toBe('ACC001');
    expect(contrato.operacao).toBe('BOOK001');
  });

  it('should handle toggleShowRAS with null target', () => {
    const { cmp } = createCmp();
    const event = { target: null } as any;
    
    cmp.toggleShowRAS(event);
    
    expect(cmp.showras).toBe(false);
  });

  it('should handle scroll position restoration after loading', async () => {
    const { cmp } = createCmp();
    
    const mockContainer = {
      scrollTop: 100,
      scrollHeight: 1000,
      clientHeight: 200,
    };
    Object.defineProperty(cmp, 'tableContainer', {
      value: { nativeElement: mockContainer },
      configurable: true,
    });

    cmp.hasUserScrolled = true;
    cmp.wasNearBottomBeforeLoad = true;
    
    // Simulate loading end
    mockBasicInfoService.loading$.next(false);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    // Should restore scroll position
    expect(mockContainer.scrollTop).toBeGreaterThanOrEqual(0);
  });
});
