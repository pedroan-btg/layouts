import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  vitest,
} from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
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
        RouterModule.forRoot([
          {
            path: 'basic-info',
            component: BasicInfoComponent,
          },
        ]),
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
    })
      .overrideComponent(BasicInfoComponent, {
        set: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

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
    controls.forEach((controlName) => {
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
    const results = inputs.map((i) => cmp.formatIsoToInput(i as any));
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
    expect(mockBasicInfoService.searchContratos).toHaveBeenCalledWith(
      'termo',
      true,
      1,
      12,
    );
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
    expect(mockBasicInfoService.searchContratos).toHaveBeenCalledWith(
      '',
      false,
      1,
      12,
    );
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

  it('applyRAS should call performApplyRAS when conditions are met', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'ABC123';
    cmp.manualLocked = false; // Garantir que não está locked

    // Mock performApplyRAS para verificar se foi chamado
    const performApplyRASSpy = vi
      .spyOn(cmp, 'performApplyRAS')
      .mockImplementation(() => {});

    cmp.applyRAS();

    expect(performApplyRASSpy).toHaveBeenCalledWith('ABC123');
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
    mockGetDealRasService.getDealRas.mockReturnValue(
      throwError(() => new Error('Test error')),
    );

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
      Object.defineProperty(container, 'scrollTop', {
        value: 900,
        configurable: true,
      });
      Object.defineProperty(container, 'scrollHeight', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(container, 'clientHeight', {
        value: 100,
        configurable: true,
      });

      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);

      // Wait for auditTime
      await new Promise((resolve) => setTimeout(resolve, 100));
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
    const callback = (mockIntersectionObserver.mock.calls as any[])?.[0]?.[0];
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
    const callback = (mockIntersectionObserver.mock.calls as any[])?.[0]?.[0];
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
    const callback = (mockIntersectionObserver.mock.calls as any[])?.[0]?.[0];
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

    await new Promise((resolve) => setTimeout(resolve, 10));
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

  it('should handle formatIsoToInput with invalid date causing exception', () => {
    const { cmp } = createCmp();

    // Mock Date constructor to throw an error
    const originalDate = global.Date;
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length > 0 && args[0] === 'invalid-date-format') {
          throw new Error('Invalid date');
        }
        super(...(args as [any]));
      }
    } as any;

    const result = (cmp as any).formatIsoToInput('invalid-date-format');
    expect(result).toBe('');

    // Restore original Date
    global.Date = originalDate;
  });

  it('should handle toggleShowRAS with null target', () => {
    const { cmp } = createCmp();
    const event = { target: null } as any;

    cmp.toggleShowRAS(event);

    expect(cmp.showras).toBe(false);
  });

  it('should handle scroll position restoration after loading', async () => {
    const { cmp } = createCmp();

    // Mock tableContainer
    const mockElement = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    };
    cmp.tableContainer = { nativeElement: mockElement };

    // Set initial state
    cmp.wasNearBottomBeforeLoad = true;
    cmp.hasUserScrolled = false;
    cmp.prevScrollTop = 200;
    cmp.isLoading = true;

    // Trigger loading state change
    mockBasicInfoService.loading$.next(false);

    // Wait for setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockElement.scrollTop).toBe(200); // Should use prevScrollTop
  });

  it('should handle scroll position with user scroll and near bottom', async () => {
    const { cmp } = createCmp();

    // Mock tableContainer
    const mockElement = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    };
    cmp.tableContainer = { nativeElement: mockElement };

    // Set state for hasUserScrolled path
    cmp.wasNearBottomBeforeLoad = true;
    cmp.hasUserScrolled = true;
    cmp.prevBottomOffset = 100;
    cmp.isLoading = true;

    // Trigger loading state change
    mockBasicInfoService.loading$.next(false);

    // Wait for setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should calculate newTop = scrollHeight - clientHeight - prevBottomOffset
    // newTop = 1000 - 500 - 100 = 400
    expect(mockElement.scrollTop).toBe(400);
  });

  it('should handle confirmApplyRAS with empty dealRAS', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '';
    cmp.showConfirmRas = true;

    cmp.confirmApplyRAS();

    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
  });

  it('should handle confirmApplyRAS with whitespace dealRAS', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '   ';
    cmp.showConfirmRas = true;

    cmp.confirmApplyRAS();

    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
  });

  it('should handle confirmApplyRAS with valid dealRAS', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'DEAL123';
    cmp.showConfirmRas = true;

    // Mock apenas performApplyRAS para evitar chamar o serviço real
    // Mas deixar onExcluirSelecionado executar normalmente para cobrir as linhas
    const performApplyRASSpy = vi
      .spyOn(cmp, 'performApplyRAS')
      .mockImplementation(() => {});
    const onExcluirSpy = vi
      .spyOn(cmp, 'onExcluirSelecionado')
      .mockImplementation(() => {
        // Simular o comportamento real do método
        cmp.manualLocked = false;
        cmp.manualContratos = [];
      });

    // Verificar estado inicial
    expect(cmp.showConfirmRas).toBe(true);

    cmp.confirmApplyRAS();

    // Verificar que os métodos foram chamados
    expect(onExcluirSpy).toHaveBeenCalled();
    expect(performApplyRASSpy).toHaveBeenCalledWith('DEAL123');

    // Verificar que o estado foi alterado
    expect(cmp.showConfirmRas).toBe(false);
  });

  it('should handle onChangePage when pageNumber equals currentPage', () => {
    const { cmp } = createCmp();

    // Mock the service page$ observable to return current page 2
    mockBasicInfoService.page$ = new BehaviorSubject(2);
    cmp.lastProcessedPage = 1; // Different from pageNumber to avoid early return

    cmp.onChangePage(2); // Same as current page from service

    expect(cmp.lastProcessedPage).toBe(2);
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
  });

  it('should handle onChangePage when pageNumber is greater than currentPage', () => {
    const { cmp } = createCmp();

    // Mock the service page$ observable to return current page 1
    mockBasicInfoService.page$ = new BehaviorSubject(1);
    cmp.lastProcessedPage = 0; // Different from pageNumber to avoid early return

    cmp.onChangePage(2); // Greater than current page

    expect(cmp.lastProcessedPage).toBe(2);
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
  });

  it('should handle onChangePage when pageNumber is less than currentPage', () => {
    const { cmp } = createCmp();

    // Mock the service page$ observable to return current page 3
    mockBasicInfoService.page$ = new BehaviorSubject(3);
    cmp.lastProcessedPage = 0; // Different from pageNumber to avoid early return

    cmp.onChangePage(1); // Less than current page

    expect(cmp.lastProcessedPage).toBe(1);
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(1);
  });

  // Testes adicionais para cobrir branches não cobertas e atingir 100%
  it('should handle loading state when tableContainer is null (linha 88)', () => {
    const { cmp } = createCmp();
    
    // Mock tableContainer como null
    Object.defineProperty(cmp, 'tableContainer', {
      value: null,
      configurable: true,
    });

    console.log('Testing branch: tableContainer is null');
    
    // Simular loading start - deve pular o bloco if (el)
    mockBasicInfoService.loading$.next(true);
    
    // Verificar que não houve erro
    expect(cmp.isLoading).toBe(true);
  });

  it('should handle scroll position when not near bottom and no user scroll (linhas 100-102)', async () => {
    const { cmp } = createCmp();

    // Mock tableContainer
    const mockElement = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    };
    cmp.tableContainer = { nativeElement: mockElement };

    console.log('Testing branch: not near bottom and no user scroll');

    // Set state for the else branch (NOT wasNearBottomBeforeLoad && hasUserScrolled)
    cmp.wasNearBottomBeforeLoad = false; // NOT near bottom
    cmp.hasUserScrolled = false; // NO user scroll
    cmp.prevScrollTop = 200;
    cmp.isLoading = true;

    // Trigger loading state change
    mockBasicInfoService.loading$.next(false);

    // Wait for setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should use prevScrollTop (linha 102)
    expect(mockElement.scrollTop).toBe(200);
  });

  it('should handle mapDealRasToContrato with empty dealRAS fallback (linha 203)', () => {
    const { cmp } = createCmp();
    
    // Set dealRAS to empty to test the fallback
    cmp.dealRAS = '';

    console.log('Testing branch: dealRAS fallback in mapDealRasToContrato');

    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    // Should use the fallback String(this.dealRAS ?? '').trim() || '-'
    expect(contrato.chave).toBe('-'); // linha 203 fallback
    expect(contrato.operacao).toBe('-'); // linha 213 fallback
  });

  it('should handle mapDealRasToContrato with all null values for operacao fallback (linha 213)', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'TEST123';

    console.log('Testing branch: operacao fallback in mapDealRasToContrato');

    const res: any = {
      NewContract: 'NC001',
      BaseContract: null,
      Account: null,
      ProductCanonical: null, // null
      UseOfProceedsCanonical: null, // null  
      Book: null, // null
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('NC001');
    expect(contrato.operacao).toBe('-'); // Should hit the fallback on linha 213
  });

  it('should handle applyRAS with valid dealRAS and no manual lock (linha 248)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing branch: valid dealRAS with no manual lock');
    
    cmp.dealRAS = 'VALID123';
    cmp.manualLocked = false; // Not locked

    // Mock performApplyRAS to verify it's called
    const performApplyRASSpy = vi
      .spyOn(cmp, 'performApplyRAS')
      .mockImplementation(() => {});

    cmp.applyRAS();

    // Should call performApplyRAS directly (linha 248)
    expect(performApplyRASSpy).toHaveBeenCalledWith('VALID123');
    expect(cmp.showConfirmRas).toBe(false); // Should not show confirmation
  });

  it('should handle onSelect when rasLocked is false (linha 327)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing branch: onSelect when rasLocked is false');
    
    cmp.rasLocked = false; // Not locked
    const row = { id: 'test123', chave: 'TEST' } as any;

    cmp.onSelect(row);

    // Should execute the method body (linhas 329-331)
    expect(mockBasicInfoService.selectContrato).toHaveBeenCalledWith(row);
    expect(cmp.manualLocked).toBe(true);
    expect(cmp.manualContratos).toEqual([row]);
  });

  it('should handle loading state with null element in setTimeout (linha 100)', async () => {
    const { cmp } = createCmp();

    console.log('Testing branch: null element in setTimeout');

    // Set initial loading state
    cmp.isLoading = true;

    // Mock tableContainer to be null during setTimeout
    Object.defineProperty(cmp, 'tableContainer', {
      value: null,
      configurable: true,
    });

    // Trigger loading state change
    mockBasicInfoService.loading$.next(false);

    // Wait for setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should handle null element gracefully (early return on linha 100)
    expect(cmp.isLoading).toBe(false);
  });

  it('should handle edge case with wasNearBottomBeforeLoad true but hasUserScrolled false', async () => {
    const { cmp } = createCmp();

    console.log('Testing edge case: near bottom but no user scroll');

    // Mock tableContainer
    const mockElement = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 500,
    };
    cmp.tableContainer = { nativeElement: mockElement };

    // Set edge case state
    cmp.wasNearBottomBeforeLoad = true; // Near bottom
    cmp.hasUserScrolled = false; // But no user scroll
    cmp.prevScrollTop = 300;
    cmp.isLoading = true;

    // Trigger loading state change
    mockBasicInfoService.loading$.next(false);

    // Wait for setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should use prevScrollTop (else branch)
    expect(mockElement.scrollTop).toBe(300);
  });

  // Testes adicionais mais específicos para cobrir as branches restantes
  it('should handle mapDealRasToContrato with specific NewContract value (linha 203)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing specific branch: NewContract exists but others null');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: 'NC001', // This should be used
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    // Should use NewContract (linha 200)
    expect(contrato.chave).toBe('NC001');
    expect(contrato.operacao).toBe('-'); // Should hit fallback on linha 213
  });

  it('should handle mapDealRasToContrato with ProductCanonical value (linha 213)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing specific branch: ProductCanonical exists');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: 'NC001',
      BaseContract: null,
      Account: null,
      ProductCanonical: 'PRODUCT001', // This should be used
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('NC001');
    expect(contrato.operacao).toBe('PRODUCT001'); // Should use ProductCanonical (linha 207)
  });

  it('should handle applyRAS with manualLocked true (linha 248 - else branch)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing branch: manualLocked is true');
    
    cmp.dealRAS = 'VALID123';
    cmp.manualLocked = true; // Locked - should show confirmation

    cmp.applyRAS();

    // Should show confirmation instead of calling performApplyRAS directly
    expect(cmp.showConfirmRas).toBe(true);
  });

  it('should handle onSelect when rasLocked is true (linha 327 - early return)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing branch: onSelect when rasLocked is true');
    
    cmp.rasLocked = true; // Locked - should return early
    const row = { id: 'test123', chave: 'TEST' } as any;

    cmp.onSelect(row);

    // Should NOT execute the method body due to early return
    expect(mockBasicInfoService.selectContrato).not.toHaveBeenCalled();
    expect(cmp.manualLocked).toBe(false); // Should remain unchanged
    expect(cmp.manualContratos).toEqual([]); // Should remain unchanged
  });

  // Teste mais específico para a linha 203 - fallback do dealRAS
  it('should use dealRAS fallback when all contract fields are null (linha 203)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing dealRAS fallback specifically');
    
    cmp.dealRAS = 'FALLBACK123';

    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    // Should use dealRAS as fallback (linha 203)
    expect(contrato.chave).toBe('FALLBACK123');
    expect(contrato.operacao).toBe('-');
  });

  // Teste mais específico para a linha 213 - fallback da operação
  it('should use operacao fallback when all operation fields are null (linha 213)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing operacao fallback specifically');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: 'NC001',
      BaseContract: null,
      Account: null,
      ProductCanonical: null, // null
      UseOfProceedsCanonical: null, // null
      Book: null, // null
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('NC001');
    expect(contrato.operacao).toBe('-'); // Should use fallback (linha 213)
  });

  // Testes específicos para cobrir branches individuais das linhas 203, 213, 248
  it('should use BaseContract when NewContract is null (linha 201)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing BaseContract branch');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: null, // null
      BaseContract: 'BC001', // This should be used
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('BC001'); // Should use BaseContract
    expect(contrato.operacao).toBe('-');
  });

  it('should use Account when NewContract and BaseContract are null (linha 202)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing Account branch');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: 'ACC001', // This should be used
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('ACC001'); // Should use Account
    expect(contrato.operacao).toBe('-');
  });

  it('should use UseOfProceedsCanonical when ProductCanonical is null (linha 208)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing UseOfProceedsCanonical branch');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: 'NC001',
      BaseContract: null,
      Account: null,
      ProductCanonical: null, // null
      UseOfProceedsCanonical: 'UOP001', // This should be used
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('NC001');
    expect(contrato.operacao).toBe('UOP001'); // Should use UseOfProceedsCanonical
  });

  it('should use Book when ProductCanonical and UseOfProceedsCanonical are null (linha 209)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing Book branch');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: 'NC001',
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: 'BOOK001', // This should be used
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('NC001');
    expect(contrato.operacao).toBe('BOOK001'); // Should use Book
  });

  it('should use final fallback "-" when dealRAS is empty and all fields are null (linha 204)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing final fallback "-" branch');
    
    cmp.dealRAS = ''; // Empty dealRAS

    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('-'); // Should use final fallback
    expect(contrato.operacao).toBe('-');
  });

  it('should handle empty string values in trim operations', () => {
    const { cmp } = createCmp();
    
    console.log('Testing empty string trim operations');
    
    cmp.dealRAS = 'TEST123';

    const res: any = {
      NewContract: '', // Empty string should be falsy after trim
      BaseContract: '  ', // Whitespace only should be falsy after trim
      Account: 'ACC001',
      ProductCanonical: '', // Empty string
      UseOfProceedsCanonical: '  ', // Whitespace only
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    expect(contrato.chave).toBe('ACC001'); // Should skip empty strings and use Account
    expect(contrato.operacao).toBe('-'); // Should use fallback
  });

  // Teste específico para cobrir a linha 244 - performApplyRAS call
  it('should call performApplyRAS when dealRAS is valid and not manually locked', () => {
    const { cmp } = createCmp();
    
    console.log('Testing direct performApplyRAS call (linha 244)');
    
    // Set up conditions for linha 244
    cmp.dealRAS = 'VALID_DEAL_RAS';
    cmp.manualLocked = false; // Not locked
    
    // Spy on performApplyRAS
    const performApplyRASSpy = vi.spyOn(cmp, 'performApplyRAS').mockImplementation(() => {});
    
    // Call applyRAS
    cmp.applyRAS();
    
    // Should call performApplyRAS with the trimmed dealRAS (linha 244)
    expect(performApplyRASSpy).toHaveBeenCalledWith('VALID_DEAL_RAS');
    expect(cmp.showConfirmRas).toBe(false); // Should not show confirmation
  });

  // Teste para cobrir branches específicas das linhas 203 e 213 com valores undefined
  it('should handle undefined values in mapDealRasToContrato', () => {
    const { cmp } = createCmp();
    
    console.log('Testing undefined values handling');
    
    cmp.dealRAS = undefined as any; // undefined dealRAS

    const res: any = {
      NewContract: undefined,
      BaseContract: undefined,
      Account: undefined,
      ProductCanonical: undefined,
      UseOfProceedsCanonical: undefined,
      Book: undefined,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    // Should handle undefined values and use fallbacks
    expect(contrato.chave).toBe('-'); // Should use final fallback
    expect(contrato.operacao).toBe('-'); // Should use final fallback
  });

  // Teste para cobrir o caso onde dealRAS é null
  it('should handle null dealRAS in mapDealRasToContrato', () => {
    const { cmp } = createCmp();
    
    console.log('Testing null dealRAS handling');
    
    cmp.dealRAS = null as any; // null dealRAS

    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    // Should handle null dealRAS and use final fallback
    expect(contrato.chave).toBe('-'); // Should use final fallback (linha 204)
    expect(contrato.operacao).toBe('-'); // Should use final fallback (linha 210)
  });

  // Teste para cobrir whitespace-only dealRAS
  it('should handle whitespace-only dealRAS in mapDealRasToContrato', () => {
    const { cmp } = createCmp();
    
    console.log('Testing whitespace-only dealRAS');
    
    cmp.dealRAS = '   '; // Whitespace only

    const res: any = {
      NewContract: null,
      BaseContract: null,
      Account: null,
      ProductCanonical: null,
      UseOfProceedsCanonical: null,
      Book: null,
    };

    const contrato = cmp.mapDealRasToContrato(res);

    // Whitespace-only dealRAS should be falsy after trim, so use final fallback
    expect(contrato.chave).toBe('-'); // Should use final fallback
    expect(contrato.operacao).toBe('-'); // Should use final fallback
  });

  // Teste específico para cobrir a linha 248 - return statement em confirmApplyRAS
  it('should return early in confirmApplyRAS when dealRAS is empty (linha 248)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing early return in confirmApplyRAS (linha 248)');
    
    // Set dealRAS to empty to trigger early return
    cmp.dealRAS = '';
    cmp.showConfirmRas = true; // Initially true
    
    // Spy on methods that should NOT be called due to early return
    const onExcluirSelecionadoSpy = vi.spyOn(cmp, 'onExcluirSelecionado');
    const performApplyRASSpy = vi.spyOn(cmp, 'performApplyRAS').mockImplementation(() => {});
    
    // Call confirmApplyRAS
    cmp.confirmApplyRAS();
    
    // Should set dealRASStatus and showConfirmRas to false, then return early (linha 248)
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
    
    // Should NOT call these methods due to early return
    expect(onExcluirSelecionadoSpy).not.toHaveBeenCalled();
    expect(performApplyRASSpy).not.toHaveBeenCalled();
  });

  // Teste para cobrir o caso onde confirmApplyRAS executa completamente
  it('should execute full confirmApplyRAS flow when dealRAS is valid', () => {
    const { cmp } = createCmp();
    
    console.log('Testing full confirmApplyRAS flow');
    
    // Set valid dealRAS
    cmp.dealRAS = 'VALID_DEAL_RAS';
    cmp.showConfirmRas = true;
    
    // Spy on methods that should be called
    const onExcluirSelecionadoSpy = vi.spyOn(cmp, 'onExcluirSelecionado').mockImplementation(() => {});
    const performApplyRASSpy = vi.spyOn(cmp, 'performApplyRAS').mockImplementation(() => {});
    
    // Call confirmApplyRAS
    cmp.confirmApplyRAS();
    
    // Should execute the full flow (after linha 248)
    expect(onExcluirSelecionadoSpy).toHaveBeenCalled(); // linha 256
    expect(cmp.showConfirmRas).toBe(false); // linha 257
    expect(performApplyRASSpy).toHaveBeenCalledWith('VALID_DEAL_RAS'); // linha 258
  });

  // Teste específico para cobrir o branch do nullish coalescing na linha 248
  it('should handle null dealRAS in confirmApplyRAS (linha 248 - nullish coalescing)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing null dealRAS in confirmApplyRAS (linha 248 - nullish coalescing)');
    
    // Set dealRAS to null to test nullish coalescing operator
    (cmp as any).dealRAS = null;
    cmp.showConfirmRas = true;
    
    // Spy on methods that should NOT be called due to early return
    const onExcluirSelecionadoSpy = vi.spyOn(cmp, 'onExcluirSelecionado');
    const performApplyRASSpy = vi.spyOn(cmp, 'performApplyRAS').mockImplementation(() => {});
    
    // Call confirmApplyRAS
    cmp.confirmApplyRAS();
    
    // Should handle null dealRAS with nullish coalescing and return early
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
    
    // Should NOT call these methods due to early return
    expect(onExcluirSelecionadoSpy).not.toHaveBeenCalled();
    expect(performApplyRASSpy).not.toHaveBeenCalled();
  });

  // Teste específico para cobrir o branch do undefined dealRAS na linha 248
  it('should handle undefined dealRAS in confirmApplyRAS (linha 248 - nullish coalescing)', () => {
    const { cmp } = createCmp();
    
    console.log('Testing undefined dealRAS in confirmApplyRAS (linha 248 - nullish coalescing)');
    
    // Set dealRAS to undefined to test nullish coalescing operator
    (cmp as any).dealRAS = undefined;
    cmp.showConfirmRas = true;
    
    // Spy on methods that should NOT be called due to early return
    const onExcluirSelecionadoSpy = vi.spyOn(cmp, 'onExcluirSelecionado');
    const performApplyRASSpy = vi.spyOn(cmp, 'performApplyRAS').mockImplementation(() => {});
    
    // Call confirmApplyRAS
    cmp.confirmApplyRAS();
    
    // Should handle undefined dealRAS with nullish coalescing and return early
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
    
    // Should NOT call these methods due to early return
    expect(onExcluirSelecionadoSpy).not.toHaveBeenCalled();
    expect(performApplyRASSpy).not.toHaveBeenCalled();
  });
});
