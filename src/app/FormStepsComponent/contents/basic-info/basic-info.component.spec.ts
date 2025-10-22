import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ElementRef } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ENV_CONFIG } from 'fts-frontui/env';

import { BasicInfoComponent } from './basic-info.component';
import { BasicInfoService } from './basic-info.service';
import { GetDealRasService } from './services/get-deal-ras.service';

// Mock dos serviços
const mockBasicInfoService = {
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

const mockGetDealRasService = {
  getDealRas: vi.fn(),
};

vi.mock('./basic-info.service', () => ({
  BasicInfoService: class BasicInfoService {},
}));

vi.mock('./services/get-deal-ras.service', () => ({
  GetDealRasService: class GetDealRasService {},
}));

describe('BasicInfoComponent', () => {
  let component: BasicInfoComponent;
  let fixture: ComponentFixture<BasicInfoComponent>;

  // Mock IntersectionObserver
  const mockIntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  beforeEach(async () => {
    // Mock global IntersectionObserver
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: mockIntersectionObserver,
    });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule, RouterTestingModule, HttpClientTestingModule, BasicInfoComponent],
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

    fixture = TestBed.createComponent(BasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Reset mocks
    vi.clearAllMocks();
    mockBasicInfoService.contratos$.next([]);
    mockBasicInfoService.total$.next(0);
    mockBasicInfoService.loading$.next(false);
    mockBasicInfoService.selectedContrato$.next(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect((component as any).form).toBeDefined();
    expect((component as any).form.get('dataContrato')).toBeDefined();
    expect((component as any).form.get('dataInicioVigencia')).toBeDefined();
    expect((component as any).form.get('tipoBaixa')).toBeDefined();
  });

  it('should have form controls', () => {
    const controls = ['dataContrato', 'dataInicioVigencia', 'tipoBaixa'];
    controls.forEach(controlName => {
      const ctrl = (component as any).form.get(controlName);
      expect(ctrl).toBeDefined();
    });
  });

  it('should have tiposBaixa array', () => {
    expect((component as any).tiposBaixa).toBeDefined();
  });

  it('should have observables defined', () => {
    // Remove references to non-existent observables
    expect((component as any).loading$).toBeDefined();
    // tiposBaixa$ doesn't exist - it's just tiposBaixa array
    // dealRas$, dealRasLoading$, dealRasError$ don't exist in the component
    expect((component as any).rasLoading$).toBeDefined(); // This one exists as rasLoading$
  });

  it('should have observables from service', () => {
    expect((component as any).contratos$).toBeDefined();
    expect((component as any).total$).toBeDefined();
    expect((component as any).page$).toBeDefined();
    expect((component as any).pageSize$).toBeDefined();
    expect((component as any).selected$).toBeDefined();
    expect((component as any).loading$).toBeDefined();
  });

  it('formatIsoToInput should format valid ISO to yyyy-MM-dd', () => {
    const input = '2024-02-29T12:34:56Z';
    const output = (component as any).formatIsoToInput(input);
    expect(output).toBe('2024-02-29');
  });

  it('formatIsoToInput should return empty for invalid and sentinel date', () => {
    const inputs = [null, undefined, '0001-01-01T00:00:00Z', 'not-a-date'];
    const results = inputs.map((i) => (component as any).formatIsoToInput(i as any));
    expect(results).toEqual(['', '', '', '']);
  });

  it('formatIsoToInput should catch exception and return empty', () => {
    const originalDate = Date;
    const throwingCtor: any = function () { throw new Error('boom'); };
    (globalThis as any).Date = throwingCtor;

    const output = (component as any).formatIsoToInput('2024-05-10T00:00:00Z');
    expect(output).toBe('');

    (globalThis as any).Date = originalDate;
  });

  it('mapDealRasToContrato should build Contrato correctly', () => {
    (component as any).dealRAS = 'ABC123';
    const res: any = {
      NewContract: 'NC001',
      BaseContract: null,
      Account: 'ACC001',
      ProductCanonical: 'ProdutoX',
      UseOfProceedsCanonical: null,
      Book: 'LivroY',
    };
    const contrato = (component as any).mapDealRasToContrato(res);
    expect(contrato.id).toBe('ras-ABC123');
    expect(contrato.chave).toBe('NC001');
    expect(['ProdutoX', 'LivroY', 'ACC001', '-']).toContain(contrato.operacao);
    expect(contrato.vinculoTrade).toBe('Não vinculado');
    expect(contrato.acao).toBe('Excluir');
  });

  it('applyRasToForm should fill form with formatted dates', () => {
    const res: any = {
      DisbursementDate: '2024-01-20T00:00:00Z',
      MaturityDate: '2024-12-05T00:00:00Z',
    };
    (component as any).applyRasToForm(res);
    expect((component as any).form.value.dataInicioVigencia).toBe('2024-01-20');
    expect((component as any).form.value.dataContrato).toBe('2024-12-05');
  });

  it('performApplyRAS should fetch, apply and lock states correctly', () => {
    const res: any = {
      DisbursementDate: '2024-01-20T00:00:00Z',
      MaturityDate: '2024-12-05T00:00:00Z',
      NewContract: 'NC001',
      ProductCanonical: 'ProdutoX',
    };
    mockGetDealRasService.getDealRas.mockReturnValue(
      of(res)
    );

    (component as any).performApplyRAS('ABC123');

    expect((component as any).rasLocked).toBe(true);
    expect((component as any).manualLocked).toBe(false);
    expect(((component as any).rasContratos || []).length).toBe(1);
    expect((component as any).dealRASStatus).toBe('OK');
    expect(mockBasicInfoService.clearSelection).toHaveBeenCalled();
  });

  it('resetRASLock should clear flags and status', () => {
    (component as any).rasLocked = true;
    (component as any).dealRASStatus = 'OK';
    (component as any).rasContratos = [{ id: 'x' }];

    (component as any).resetRASLock();

    expect((component as any).rasLocked).toBe(false);
    expect((component as any).dealRASStatus).toBe('-');
    expect((component as any).rasContratos).toEqual([]);
  });

});

describe('BasicInfoComponent (coverage extras)', () => {
  let component: BasicInfoComponent;
  let fixture: ComponentFixture<BasicInfoComponent>;

  beforeEach(async () => {
    const mockIntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: mockIntersectionObserver,
    });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule, RouterTestingModule, HttpClientTestingModule, BasicInfoComponent],
      providers: [
        FormBuilder,
        { provide: BasicInfoService, useValue: mockBasicInfoService },
        { provide: GetDealRasService, useValue: mockGetDealRasService },
        { provide: ENV_CONFIG, useValue: { environment: 'test', version: '0.0.0', logDisabled: true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    vi.clearAllMocks();
    mockBasicInfoService.contratos$.next([]);
    mockBasicInfoService.total$.next(0);
    mockBasicInfoService.loading$.next(false);
    mockBasicInfoService.selectedContrato$.next(null);
  });

  it('ngAfterViewInit: dispara loadNextPage no scroll ao fundo', async () => {
    const svc = (component as any).svc;
    vi.useFakeTimers();

    const container = document.createElement('div');
    Object.defineProperties(container, {
      scrollTop: { value: 99, writable: true },
      scrollHeight: { value: 200, writable: true },
      clientHeight: { value: 100, writable: true },
    });
    Object.defineProperty(component as any, 'tableContainer', { value: { nativeElement: container }, configurable: true });

    svc.contratos$.next([{}, {}]);
    svc.total$.next(10);
    svc.loading$.next(false);

    (component as any).ngAfterViewInit();

    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(60);

    expect(svc.loadNextPage).toHaveBeenCalledTimes(1);
  });

  it('IntersectionObserver: chama onLoadMore quando sentinel intersecta', () => {
    const svc = (component as any).svc;
    let ioCallback: any;
    const observe = vi.fn();
    (globalThis as any).IntersectionObserver = vi.fn((cb: any) => {
      ioCallback = cb;
      return { observe, unobserve: vi.fn(), disconnect: vi.fn() };
    });

    const container = document.createElement('div');
    Object.defineProperties(container, {
      scrollTop: { value: 0, writable: true },
      scrollHeight: { value: 1000, writable: true },
      clientHeight: { value: 500, writable: true },
    });
    Object.defineProperty(component as any, 'tableContainer', { value: { nativeElement: container }, configurable: true });

    const sentinel = document.createElement('div');
    Object.defineProperty(component as any, 'infiniteSentinel', { value: { nativeElement: sentinel }, configurable: true });

    svc.contratos$.next([{}, {}, {}]);
    svc.total$.next(10);
    svc.loading$.next(false);

    (component as any).ngAfterViewInit();
    expect(observe).toHaveBeenCalledWith(sentinel);

    vi.clearAllMocks();
    ioCallback?.([{ isIntersecting: true }]);

    expect(svc.loadNextPage).toHaveBeenCalledTimes(1);
  });

  it('loading$: mantém posição ao recarregar perto do fim', () => {
    const svc = (component as any).svc;
    vi.useFakeTimers();
    const container = document.createElement('div');
    Object.defineProperties(container, {
      scrollTop: { value: 598, writable: true },
      scrollHeight: { value: 1000, writable: true },
      clientHeight: { value: 400, writable: true },
    });
    Object.defineProperty(component as any, 'tableContainer', { value: { nativeElement: container }, configurable: true });

    (component as any).hasUserScrolled = true;

    svc.loading$.next(true);
    svc.loading$.next(false);
    vi.runAllTimers();

    expect(container.scrollTop).toBe(598);
  });

  it('loading$: não perto do fim volta ao topo anterior', () => {
    const svc = (component as any).svc;
    vi.useFakeTimers();
    const container = document.createElement('div');
    Object.defineProperties(container, {
      scrollTop: { value: 500, writable: true },
      scrollHeight: { value: 1000, writable: true },
      clientHeight: { value: 400, writable: true },
    });
    Object.defineProperty(component as any, 'tableContainer', { value: { nativeElement: container }, configurable: true });

    (component as any).hasUserScrolled = true;

    svc.loading$.next(true);
    svc.loading$.next(false);
    vi.runAllTimers();

    expect(container.scrollTop).toBe(500);
  });

  it('applyRAS: id vazio informa mensagem', () => {
    (component as any).inputDealRAS = '';
    (component as any).applyRAS();
    expect((component as any).dealRASStatus).toContain('Informe o Deal RAS');
  });

  it('applyRAS: bloqueio manual abre confirmação', () => {
  (component as any).dealRAS = '123';
  (component as any).manualLocked = true;
  (component as any).applyRAS();
  expect((component as any).showConfirmRas).toBe(true);
});

  it('confirmApplyRAS: id vazio cancela e informa', () => {
    (component as any).inputDealRAS = '';
    (component as any).showConfirmRas = true;
    (component as any).confirmApplyRAS();
    expect((component as any).dealRASStatus).toContain('Informe o Deal RAS');
    expect((component as any).showConfirmRas).toBe(false);
  });

  it('cancelApplyRAS: esconde confirmação', () => {
    (component as any).showConfirmRas = true;
    (component as any).cancelApplyRAS();
    expect((component as any).showConfirmRas).toBe(false);
  });

  it('performApplyRAS: lida com erro e não aplica', () => {
  const applySpy = vi.spyOn(component as any, 'applyRasToForm');
  const getSvc = (component as any).dealRasSvc;
  getSvc.getDealRas.mockReturnValue(throwError(() => new Error('boom')));

  (component as any).performApplyRAS('ABC');

  expect(applySpy).not.toHaveBeenCalled();
  expect((component as any).dealRASStatus).toBe('Erro ao buscar');
  const rasLoading = ((component as any).rasLoading$ as BehaviorSubject<boolean>).value;
  expect(rasLoading).toBe(false);
});

  it('onChangePage: deduplica e navega', () => {
  const svc = (component as any).svc;
  svc.page$.next(1);
  (component as any).lastProcessedPage = 1;
  (component as any).onChangePage(1);
  expect(svc.changePage).not.toHaveBeenCalled();

  vi.clearAllMocks();
  svc.page$.next(1);
  (component as any).onChangePage(2);
  expect(svc.changePage).toHaveBeenCalledWith(2);

  vi.clearAllMocks();
  svc.page$.next(3);
  (component as any).lastProcessedPage = 0; // evita deduplicação
  (component as any).onChangePage(2);
  expect(svc.changePage).toHaveBeenCalledWith(2);

  vi.clearAllMocks();
  svc.page$.next(2);
  (component as any).onChangePage(2);
  expect(svc.changePage).not.toHaveBeenCalled();
});

  it('onChangePageSize: respeita bloqueio e altera tamanho', () => {
    const svc = (component as any).svc;
    (component as any).rasLocked = true;
    (component as any).onChangePageSize(50);
    expect(svc.changePageSize).not.toHaveBeenCalled();

    vi.clearAllMocks();
    (component as any).rasLocked = false;
    (component as any).onChangePageSize(25);
    expect(svc.changePageSize).toHaveBeenCalledWith(25);
  });

  it('onLoadMore: respeita bloqueio e carrega próxima página', () => {
    const svc = (component as any).svc;
    (component as any).rasLocked = true;
    (component as any).onLoadMore();
    expect(svc.loadNextPage).not.toHaveBeenCalled();

    vi.clearAllMocks();
    (component as any).rasLocked = false;
    (component as any).onLoadMore();
    expect(svc.loadNextPage).toHaveBeenCalledTimes(1);
  });

  it('onSelect: bloqueio manual e contrato selecionado', () => {
  const svc = (component as any).svc;
  (component as any).rasLocked = false;
  const row = { id: 1 } as any;
  (component as any).onSelect(row);
  expect((component as any).manualLocked).toBe(true);
  expect((component as any).manualContratos.length).toBe(1);
  expect(svc.selectContrato).toHaveBeenCalledWith(row);
});

  it('onPrevPage: respeita bloqueio e navega quando possível', () => {
    const svc = (component as any).svc;
    (component as any).rasLocked = true;
    svc.page$.next(2);
    (component as any).onPrevPage();
    expect(svc.changePage).not.toHaveBeenCalled();

    vi.clearAllMocks();
    (component as any).rasLocked = false;
    svc.page$.next(1);
    (component as any).onPrevPage();
    expect(svc.changePage).not.toHaveBeenCalled();

    vi.clearAllMocks();
    svc.page$.next(2);
    (component as any).onPrevPage();
    expect(svc.changePage).toHaveBeenCalledWith(1);
  });

  it('onNextPage: respeita bloqueio e limita ao total', () => {
  const svc = (component as any).svc;

  // bloqueado: não navega
  (component as any).rasLocked = true;
  svc.page$.next(1);
  svc.total$.next(24);
  (component as any).onNextPage();
  expect(svc.changePage).not.toHaveBeenCalled();

  // desbloqueado: navega se houver próxima página considerando pageSize=12
  vi.clearAllMocks();
  (component as any).rasLocked = false;
  svc.page$.next(1);
  svc.total$.next(24); // maxPages = 2
  (component as any).onNextPage();
  expect(svc.changePage).toHaveBeenCalledWith(2);

  // na última página não chama changePage
  vi.clearAllMocks();
  svc.page$.next(2);
  svc.total$.next(24); // nextPage = 3 > 2
  (component as any).onNextPage();
  expect(svc.changePage).not.toHaveBeenCalled();
});

  it('onExcluirRAS: reseta estado de RAS mantendo seleção manual', () => {
  (component as any).dealRASStatus = 'algo';
  (component as any).rasLocked = true;
  (component as any).rasContratos = [{}, {}];
  (component as any).manualLocked = true;
  (component as any).manualContratos = [{}, {}];

  (component as any).onExcluirRAS();

  expect((component as any).dealRASStatus).toBe('-');
  expect((component as any).rasLocked).toBe(false);
  expect(((component as any).rasContratos || []).length).toBe(0);
  // seleção manual não é alterada por onExcluirRAS
  expect((component as any).manualLocked).toBe(true);
  expect((component as any).manualContratos.length).toBe(2);
});

  it('onExcluirSelecionado: limpa seleção e bloqueio manual', () => {
    const svc = (component as any).svc;
    (component as any).manualLocked = true;
    (component as any).manualContratos = [{}, {}];
    (component as any).onExcluirSelecionado();
    expect((component as any).manualLocked).toBe(false);
    expect((component as any).manualContratos.length).toBe(0);
    expect(svc.clearSelection).toHaveBeenCalledTimes(1);
  });

  it('toggleShowRAS: alterna e reseta quando desligado', () => {
    (component as any).toggleShowRAS({ target: { checked: true } } as any);
    expect((component as any).showras).toBe(true);

    (component as any).toggleShowRAS({ target: { checked: false } } as any);
    expect((component as any).showras).toBe(false);
    expect((component as any).dealRASStatus).toBe('-');
  });

  it('ngOnDestroy: desconecta IntersectionObserver', () => {
    const disconnect = vi.fn();
    (component as any).io = { disconnect };
    (component as any).ngOnDestroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('onBuscar: respeita bloqueio e chama serviço com parâmetros', () => {
    const svc = (component as any).svc;
    (component as any).rasLocked = true;
    (component as any).onBuscar();
    expect(svc.searchContratos).not.toHaveBeenCalled();

    vi.clearAllMocks();
    (component as any).rasLocked = false;
    (component as any).searchText = 'termo';
    (component as any).onlyNotLinked = true;
    (component as any).onBuscar();
    expect(svc.searchContratos).toHaveBeenCalledWith('termo', true, 1, 12);
  });

  it('clearSearch: respeita bloqueio, zera filtros e reconsulta', () => {
    const svc = (component as any).svc;
    (component as any).rasLocked = true;
    (component as any).clearSearch();
    expect(svc.searchContratos).not.toHaveBeenCalled();

    vi.clearAllMocks();
    (component as any).rasLocked = false;
    (component as any).searchText = 'abc';
    (component as any).onlyNotLinked = true;
    (component as any).clearSearch();
    expect((component as any).searchText).toBe('');
    expect((component as any).onlyNotLinked).toBe(false);
    expect(svc.searchContratos).toHaveBeenCalledWith('', false, 1, 12);
  });

  it('mapDealRasToContrato: usa BaseContract e UseOfProceeds', () => {
    (component as any).dealRAS = 'ID123';
    const res: any = { NewContract: undefined, BaseContract: 'BC01', Account: 'ACC99', ProductCanonical: undefined, UseOfProceedsCanonical: 'Uso', Book: undefined };
    const c = (component as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('BC01');
    expect(c.operacao).toBe('Uso');
  });

  it('mapDealRasToContrato: fallback para Account e "-" quando operação ausente', () => {
    (component as any).dealRAS = 'IDZZ';
    const res: any = { NewContract: undefined, BaseContract: undefined, Account: 'ACC01', ProductCanonical: undefined, UseOfProceedsCanonical: undefined, Book: undefined };
    const c = (component as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('ACC01');
    expect(c.operacao).toBe('-');
  });

  it('mapDealRasToContrato: sem chave usa "-" quando dealRAS vazio', () => {
    (component as any).dealRAS = '';
    const res: any = { NewContract: undefined, BaseContract: undefined, Account: undefined, ProductCanonical: undefined, UseOfProceedsCanonical: undefined, Book: undefined };
    const c = (component as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('-');
    expect(c.operacao).toBe('-');
  });

  it('toggleShowRAS: desliga e força rasLoading false', () => {
    const rasLoading$ = (component as any).rasLoading$ as BehaviorSubject<boolean>;
    rasLoading$.next(true);
    (component as any).toggleShowRAS({ target: { checked: false } } as any);
    expect(rasLoading$.value).toBe(false);
  });

  it('applyRAS: com id e sem bloqueio chama performApplyRAS', () => {
    const spy = vi.spyOn(component as any, 'performApplyRAS').mockImplementation(() => {});
    (component as any).manualLocked = false;
    (component as any).dealRAS = 'XYZ123';
    (component as any).applyRAS();
    expect(spy).toHaveBeenCalledWith('XYZ123');
  });

  it('confirmApplyRAS: com id válido exclui seleção, oculta e chama perform', () => {
    const perfSpy = vi.spyOn(component as any, 'performApplyRAS').mockImplementation(() => {});
    const svc = (component as any).svc;
    (component as any).dealRAS = 'CONF01';
    (component as any).manualLocked = true;
    (component as any).manualContratos = [{}, {}];
    (component as any).showConfirmRas = true;

    (component as any).confirmApplyRAS();

    expect((component as any).showConfirmRas).toBe(false);
    expect((component as any).manualLocked).toBe(false);
    expect((component as any).manualContratos.length).toBe(0);
    expect(svc.clearSelection).toHaveBeenCalledTimes(1);
    expect(perfSpy).toHaveBeenCalledWith('CONF01');
  });

  it('onChangePage: quando igual ao atual apenas atualiza lastProcessedPage', () => {
    const svc = (component as any).svc;
    svc.page$.next(5);
    (component as any).lastProcessedPage = 0;
    (component as any).onChangePage(5);
    expect(svc.changePage).not.toHaveBeenCalled();
    expect((component as any).lastProcessedPage).toBe(5);
  });

  it('mapDealRasToContrato: usa dealRAS como chave quando campos vazios', () => {
    (component as any).dealRAS = 'DR-42';
    const res: any = { NewContract: '   ', BaseContract: '   ', Account: '   ', ProductCanonical: undefined, UseOfProceedsCanonical: undefined, Book: undefined };
    const c = (component as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('DR-42');
    expect(c.operacao).toBe('-');
  });

  it('mapDealRasToContrato: usa Book quando Product e UseOfProceeds vazios', () => {
    (component as any).dealRAS = 'IDBOOK';
    const res: any = { NewContract: undefined, BaseContract: undefined, Account: undefined, ProductCanonical: '   ', UseOfProceedsCanonical: '   ', Book: 'LivroY' };
    const c = (component as any).mapDealRasToContrato(res);
    expect(c.operacao).toBe('LivroY');
  });

  it('applyRAS: sem id define status e não chama performApplyRAS', () => {
    const spy = vi.spyOn(component as any, 'performApplyRAS').mockImplementation(() => {});
    (component as any).manualLocked = false;
    (component as any).dealRAS = '   ';
    (component as any).applyRAS();
    expect((component as any).dealRASStatus).toBe('Informe o Deal RAS');
    expect(spy).not.toHaveBeenCalled();
  });

  it('confirmApplyRAS: sem id define status, oculta modal e não executa', () => {
    const perfSpy = vi.spyOn(component as any, 'performApplyRAS').mockImplementation(() => {});
    const exclSpy = vi.spyOn(component as any, 'onExcluirSelecionado');
    (component as any).dealRAS = '   ';
    (component as any).showConfirmRas = true;

    (component as any).confirmApplyRAS();

    expect((component as any).dealRASStatus).toBe('Informe o Deal RAS');
    expect((component as any).showConfirmRas).toBe(false);
    expect(perfSpy).not.toHaveBeenCalled();
    expect(exclSpy).not.toHaveBeenCalled();
  });

  it('onSelect: quando rasLocked verdadeiro não seleciona nem bloqueia manual', () => {
    const svc = (component as any).svc;
    (component as any).rasLocked = true;
    (component as any).manualLocked = false;
    (component as any).manualContratos = [];

    (component as any).onSelect({ id: 'c1', chave: 'X', operacao: 'Y' } as any);

    expect(svc.selectContrato).not.toHaveBeenCalled();
    expect((component as any).manualLocked).toBe(false);
    expect((component as any).manualContratos.length).toBe(0);
  });
});