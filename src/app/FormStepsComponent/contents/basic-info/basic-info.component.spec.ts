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

// Mocks mínimos dos módulos UI
vitest.mock('fts-frontui/table', () => ({
  Table: Component({
    selector: 'fts-table',
    standalone: true,
    template: '<div><ng-content></ng-content></div>',
  })(class {}),
  TableColumn: Component({
    selector: 'fts-table-column',
    standalone: true,
    template: '<div><ng-content></ng-content></div>',
  })(class {}),
}));
vitest.mock('fts-frontui/loading', () => ({
  Loading: Component({
    selector: 'fts-loading',
    standalone: true,
    template: '<div></div>',
  })(class {}),
}));
vitest.mock('fts-frontui/i18n', () => ({
  i18n: Component({
    selector: 'fts-i18n',
    standalone: true,
    template: '<div><ng-content></ng-content></div>',
  })(class {}),
}));

// Mocks dos serviços
vitest.mock('./basic-info.service', () => ({ BasicInfoService: vi.fn() }));
vitest.mock('./services/get-deal-ras.service', () => ({
  GetDealRasService: vi.fn(),
}));

describe('BasicInfoComponent (agrupado por método)', () => {
  let mockBasicInfoService: any;
  let mockGetDealRasService: any;

  const mockIntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  beforeEach(async () => {
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
    };
    mockGetDealRasService = { getDealRas: vi.fn() };

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
          { path: 'basic-info', component: BasicInfoComponent },
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

  it('constructor/ngAfterViewInit/ngOnDestroy: inicializa, observa e desconecta', async () => {
    const { cmp } = createCmp();
    expect(cmp.form.get('dataContrato')).toBeDefined();
    expect(cmp.tiposBaixa?.length).toBeGreaterThan(0);

    // Transição para loading com container
    const el0: any = cmp.tableContainer.nativeElement;
    Object.defineProperty(el0, 'scrollTop', {
      value: 100,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(el0, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(el0, 'clientHeight', {
      value: 900,
      configurable: true,
    });
    mockBasicInfoService.loading$.next(true);
    expect(cmp.wasNearBottomBeforeLoad).toBe(true);

    // Scroll carrega mais quando próximo do fim
    const el: any = cmp.tableContainer.nativeElement;
    cmp.currentCount = 10;
    cmp.totalCount = 20;
    cmp.isLoading = false;
    Object.defineProperty(el, 'scrollTop', {
      value: 900,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(el, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(el, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    el.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 100));
    expect(mockBasicInfoService.loadNextPage).toHaveBeenCalledTimes(1);

    // IntersectionObserver
    cmp.currentCount = 0;
    cmp.totalCount = 1;
    cmp.isLoading = false;
    const cb = (mockIntersectionObserver.mock.calls as any[])?.[0]?.[0];
    cb?.([{ isIntersecting: true }]);
    expect(mockBasicInfoService.loadNextPage).toHaveBeenCalled();

    // Reposição branch true: nearBottom e hasUserScrolled
    cmp.hasUserScrolled = true;
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(el0.scrollTop).toBe(900);

    // Branch else da reposição: sem nearBottom/hasUserScrolled
    cmp.hasUserScrolled = false;
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(el0.scrollTop).toBe(900);

    // Reposição com container ausente
    Object.defineProperty(cmp, 'tableContainer', {
      value: undefined,
      configurable: true,
    });
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);
    await new Promise((r) => setTimeout(r, 0));

    // ngOnDestroy
    const disconnect = vi.fn();
    cmp.io = { disconnect };
    cmp.ngOnDestroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('constructor/ngAfterViewInit/ngOnDestroy: reposiciona para newTop quando usuário scrolou e estava perto do fim', async () => {
    const { cmp } = createCmp();
    const el: any = cmp.tableContainer.nativeElement;
    Object.defineProperty(el, 'scrollTop', {
      value: 900,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(el, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(el, 'clientHeight', {
      value: 900,
      configurable: true,
    });

    cmp.hasUserScrolled = true;
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);

    await new Promise((res) => setTimeout(res, 0));
    expect(el.scrollTop).toBe(100);
  });

  it('paginação: onChangePage/Size, prev/next respeitam locks e limites', () => {
    const { cmp } = createCmp();

    // onChangePage
    mockBasicInfoService.page$ = new BehaviorSubject(1);
    cmp.onChangePage(2);
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
    cmp.lastProcessedPage = 2;
    mockBasicInfoService.page$ = new BehaviorSubject(2);
    cmp.onChangePage(2); // não deve chamar novamente

    // onChangePage igual à página atual sem early return
    mockBasicInfoService.changePage.mockClear();
    mockBasicInfoService.page$ = new BehaviorSubject(2);
    cmp.lastProcessedPage = 0;
    cmp.onChangePage(2);
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
    expect(cmp.lastProcessedPage).toBe(2);

    // onChangePage (string) e menor que current
    mockBasicInfoService.changePage.mockClear();
    mockBasicInfoService.page$ = new BehaviorSubject(3);
    cmp.lastProcessedPage = 0;
    cmp.onChangePage('2' as any);
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);

    // onChangePageSize
    cmp.rasLocked = true;
    cmp.onChangePageSize(24);
    expect(mockBasicInfoService.changePageSize).not.toHaveBeenCalled();
    cmp.rasLocked = false;
    cmp.manualLocked = false;
    cmp.onChangePageSize(24);
    expect(mockBasicInfoService.changePageSize).toHaveBeenCalledWith(24);

    // prevPage
    cmp.page$ = new BehaviorSubject(3);
    cmp.rasLocked = false;
    cmp.manualLocked = false;
    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
    mockBasicInfoService.changePage.mockClear();
    cmp.page$ = new BehaviorSubject(1);
    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();

    // nextPage
    cmp.page$ = new BehaviorSubject(1);
    cmp.totalCount = 24;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
    mockBasicInfoService.changePage.mockClear();
    cmp.page$ = new BehaviorSubject(2);
    cmp.totalCount = 24;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();

    // nextPage respeita locks
    mockBasicInfoService.changePage.mockClear();
    cmp.rasLocked = true;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
    cmp.rasLocked = false;
    cmp.manualLocked = true;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();

    // loadMore respeita locks
    mockBasicInfoService.loadNextPage.mockClear();
    cmp.rasLocked = true;
    cmp.manualLocked = false;
    cmp.onLoadMore();
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
    cmp.rasLocked = false;
    cmp.manualLocked = true;
    cmp.onLoadMore();
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
  });

  it('seleção/locks e exclusões: onSelect, onExcluirRAS, onExcluirSelecionado', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.onSelect({ id: '1' } as any);
    expect(mockBasicInfoService.selectContrato).not.toHaveBeenCalled();
    cmp.rasLocked = false;
    cmp.onSelect({ id: '1' } as any);
    expect(cmp.manualLocked).toBe(true);
    expect(cmp.manualContratos.length).toBe(1);

    cmp.rasLocked = true;
    cmp.rasContratos = [{ id: 'x' }];
    cmp.dealRASStatus = 'OK';
    cmp.onExcluirRAS();
    expect(cmp.rasLocked).toBe(false);
    expect(cmp.rasContratos).toEqual([]);
    expect(cmp.dealRASStatus).toBe('-');

    cmp.manualLocked = true;
    cmp.manualContratos = [{ id: 'x' }];
    cmp.onExcluirSelecionado();
    expect(cmp.manualLocked).toBe(false);
    expect(cmp.manualContratos).toEqual([]);
    expect(mockBasicInfoService.clearSelection).toHaveBeenCalled();
  });

  it('mapDealRasToContrato: operacao usa ProductCanonical quando disponível', () => {
    const { cmp } = createCmp();
    const c = cmp.mapDealRasToContrato({ ProductCanonical: 'OperX' } as any);
    expect(c.operacao).toBe('OperX');
  });

  it('applyRAS: chama performApplyRAS quando não locked e id válido', async () => {
    const { cmp } = createCmp();
    cmp.dealRAS = 'XYZ123';
    cmp.manualLocked = false;
    mockGetDealRasService.getDealRas.mockReturnValue(of({} as any));

    cmp.applyRAS();
    await Promise.resolve();
    expect(mockGetDealRasService.getDealRas).toHaveBeenCalledWith('XYZ123');
  });

  it('formatIsoToInput: trata válidos, inválidos e sentinelas', () => {
    const { cmp } = createCmp();
    expect(cmp.formatIsoToInput('2024-02-29T12:34:56Z')).toBe('2024-02-29');
    expect(cmp.formatIsoToInput('0001-01-01T00:00:00Z')).toBe('');
    expect(cmp.formatIsoToInput('not-a-date' as any)).toBe('');
    expect(cmp.formatIsoToInput(null as any)).toBe('');
  });

  it('formatIsoToInput: cobre catch via Date inválido', () => {
    const { cmp } = createCmp();
    const OriginalDate = Date;
    // Override Date to throw for specific input
    // @ts-ignore
    global.Date = class extends Date {
      constructor(arg?: any) {
        if (arg === 'invalid-date-format') throw new Error('Invalid date');
        super(arg as any);
      }
    } as any;
    expect(cmp.formatIsoToInput('invalid-date-format' as any)).toBe('');
    // restore
    global.Date = OriginalDate as any;
  });

  it('apply/confirm/cancel RAS: cobre fluxos principais', () => {
    const { cmp } = createCmp();

    // applyRAS vazio
    cmp.dealRAS = '';
    cmp.applyRAS();
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');

    // applyRAS com confirmação
    cmp.dealRAS = 'ABC123';
    cmp.manualLocked = true;
    cmp.applyRAS();
    expect(cmp.showConfirmRas).toBe(true);

    // confirmApplyRAS vazio
    cmp.dealRAS = '';
    cmp.showConfirmRas = true;
    cmp.confirmApplyRAS();
    expect(cmp.showConfirmRas).toBe(false);

    // confirmApplyRAS aplicando
    const res: any = {
      DisbursementDate: '2024-01-20T00:00:00Z',
      MaturityDate: '2024-12-05T00:00:00Z',
      NewContract: 'NC001',
    };
    mockGetDealRasService.getDealRas.mockReturnValue(of(res));
    cmp.dealRAS = 'ABC123';
    cmp.manualLocked = true;
    cmp.manualContratos = [{ id: 'x' }];
    cmp.showConfirmRas = true;
    cmp.confirmApplyRAS();
    expect(cmp.showConfirmRas).toBe(false);
    expect(cmp.manualLocked).toBe(false);
    expect(cmp.manualContratos).toEqual([]);
    expect(mockBasicInfoService.clearSelection).toHaveBeenCalled();

    // cancelApplyRAS
    cmp.showConfirmRas = true;
    cmp.cancelApplyRAS();
    expect(cmp.showConfirmRas).toBe(false);
  });

  it('performApplyRAS: sucesso mapeia e atualiza estados', () => {
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

  it('performApplyRAS: erro atualiza status', async () => {
    const { cmp } = createCmp();
    mockGetDealRasService.getDealRas.mockReturnValue(
      throwError(() => new Error('x')),
    );
    cmp.performApplyRAS('ABC123');
    await new Promise((r) => setTimeout(r, 0));
    expect(cmp.dealRASStatus).toBe('Erro ao buscar');
  });

  it('toggleShowRAS: alterna e reseta locks quando desabilita', () => {
    const { cmp } = createCmp();
    cmp.toggleShowRAS({ target: { checked: true } } as any);
    expect(cmp.showras).toBe(true);
    cmp.rasLocked = true;
    cmp.dealRASStatus = 'OK';
    cmp.toggleShowRAS({ target: { checked: false } } as any);
    expect(cmp.showras).toBe(false);
    expect(cmp.rasLocked).toBe(false);
    expect(cmp.dealRASStatus).toBe('-');
  });

  it('buscar/limpar: respeita locks e chama service corretamente', () => {
    const { cmp } = createCmp();
    cmp.rasLocked = true;
    cmp.onBuscar();
    expect(mockBasicInfoService.searchContratos).not.toHaveBeenCalled();
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

    cmp.rasLocked = true;
    cmp.searchText = 'x';
    cmp.clearSearch();
    expect(cmp.searchText).toBe('x');
    cmp.rasLocked = false;
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

  it('mapDealRasToContrato: todos nulos usam fallback final', () => {
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

  // Coberturas adicionais de branches
  it('ngAfterViewInit: container nulo retorna sem erro', () => {
    const { cmp } = createCmp();
    Object.defineProperty(cmp, 'tableContainer', {
      value: { nativeElement: null },
      configurable: true,
    });
    Object.defineProperty(cmp, 'infiniteSentinel', {
      value: { nativeElement: null },
      configurable: true,
    });
    expect(() => cmp.ngAfterViewInit()).not.toThrow();
  });

  it('ngAfterViewInit: sentinel nulo não cria IntersectionObserver', () => {
    const { cmp } = createCmp();
    const el: any = cmp.tableContainer.nativeElement;
    Object.defineProperty(el, 'scrollTop', {
      value: 100,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(el, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(el, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    vi.clearAllMocks();
    Object.defineProperty(cmp, 'infiniteSentinel', {
      value: { nativeElement: null },
      configurable: true,
    });
    cmp.ngAfterViewInit();
    expect((window as any).IntersectionObserver).toBeDefined();
    expect((mockIntersectionObserver as any).mock.calls.length).toBe(0);
  });

  it('scroll: não estando no fundo não chama onLoadMore', async () => {
    const { cmp } = createCmp();
    const el: any = cmp.tableContainer.nativeElement;
    cmp.currentCount = 10;
    cmp.totalCount = 20;
    cmp.isLoading = false;
    Object.defineProperty(el, 'scrollTop', {
      value: 100,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(el, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(el, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    el.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 100));
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
  });

  it('IntersectionObserver: isIntersecting=false não chama onLoadMore', () => {
    const { cmp } = createCmp();
    cmp.currentCount = 0;
    cmp.totalCount = 5;
    cmp.isLoading = false;
    const cb = (mockIntersectionObserver.mock.calls as any[])?.[0]?.[0];
    cb?.([{ isIntersecting: false }]);
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
  });

  it('mapDealRasToContrato: chave usa BaseContract quando NewContract vazio', () => {
    const { cmp } = createCmp();
    const res: any = { NewContract: '   ', BaseContract: 'BCX' };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('BCX');
  });

  it('mapDealRasToContrato: chave usa Account quando New e Base vazios', () => {
    const { cmp } = createCmp();
    const res: any = { NewContract: '', BaseContract: '', Account: 'ACCX' };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('ACCX');
  });

  it('mapDealRasToContrato: chave usa dealRAS quando anteriores nulos', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = 'DRS1';
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('DRS1');
  });

  it('mapDealRasToContrato: operacao usa UseOfProceedsCanonical quando Product vazio', () => {
    const { cmp } = createCmp();
    const res: any = {
      ProductCanonical: '   ',
      UseOfProceedsCanonical: 'UOPX',
    };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.operacao).toBe('UOPX');
  });

  it('mapDealRasToContrato: operacao usa Book quando anteriores vazios', () => {
    const { cmp } = createCmp();
    const res: any = {
      ProductCanonical: '',
      UseOfProceedsCanonical: '',
      Book: 'BKX',
    };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.operacao).toBe('BKX');
  });

  it('onPrevPage: respeita locks com early return', () => {
    const { cmp } = createCmp();
    cmp.page$ = new BehaviorSubject(3);
    cmp.rasLocked = true;
    cmp.manualLocked = false;
    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
    cmp.rasLocked = false;
    cmp.manualLocked = true;
    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
  });
  it('mapDealRasToContrato: id usa dealRAS quando não vazio', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = 'DRS-ID';
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.id).toBe('ras-DRS-ID');
  });

  it("mapDealRasToContrato: id usa 'unk' quando dealRAS vazio", () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = '';
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.id).toBe('ras-unk');
  });

  it('applyRAS: remove espaços e chama serviço com id trimado', async () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '  XYZ  ';
    cmp.manualLocked = false;
    mockGetDealRasService.getDealRas.mockReturnValue(of({} as any));
    cmp.applyRAS();
    await Promise.resolve();
    expect(mockGetDealRasService.getDealRas).toHaveBeenCalledWith('XYZ');
  });

  it('mapDealRasToContrato: chave usa "-" quando dealRAS undefined', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = undefined;
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('-');
  });

  it('mapDealRasToContrato: operacao usa Book quando UseOfProceedsCanonical ausente', () => {
    const { cmp } = createCmp();
    const res: any = { ProductCanonical: '', Book: 'BKX' }; // sem UseOfProceedsCanonical
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.operacao).toBe('BKX');
  });

  it('confirmApplyRAS: dealRAS null retorna cedo e não aplica', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = null;
    cmp.showConfirmRas = true;
    mockGetDealRasService.getDealRas.mockClear();
    cmp.confirmApplyRAS();
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
    expect(mockGetDealRasService.getDealRas).not.toHaveBeenCalled();
  });

  it('confirmApplyRAS: dealRAS undefined retorna cedo e não aplica', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = undefined;
    cmp.showConfirmRas = true;
    mockGetDealRasService.getDealRas.mockClear();
    cmp.confirmApplyRAS();
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
    expect(cmp.showConfirmRas).toBe(false);
    expect(mockGetDealRasService.getDealRas).not.toHaveBeenCalled();
  });
});
