import './basic-info.spec.mock-base';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { setupBasicInfoTest } from './basic-info.spec.helpers';

describe('BasicInfoComponent (compact spec)', () => {
  let mockBasicInfoService: any;
  let mockGetDealRasService: any;
  let createCmp: () => { fixture: any; cmp: any };
  let setScroll: (el: any, top: number, height: number, client: number) => void;
  let ioCb: () => any;

  beforeEach(async () => {
    ({
      mockBasicInfoService,
      mockGetDealRasService,
      createCmp,
      setScroll,
      ioCb,
    } = await setupBasicInfoTest());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa e cobre lifecycle básico', async () => {
    const { cmp } = createCmp();
    expect(cmp.form.get('dataContrato')).toBeDefined();
    expect(cmp.tiposBaixa?.length).toBeGreaterThan(0);

    const el0: any = cmp.tableContainer.nativeElement;
    setScroll(el0, 100, 1000, 900);
    mockBasicInfoService.loading$.next(true);
    expect(cmp.wasNearBottomBeforeLoad).toBe(true);

    const el: any = cmp.tableContainer.nativeElement;
    cmp.currentCount = 10;
    cmp.totalCount = 20;
    cmp.isLoading.set(false);
    setScroll(el, 900, 1000, 100);
    el.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 100));
    expect(mockBasicInfoService.loadNextPage).toHaveBeenCalledTimes(1);

    cmp.currentCount = 0;
    cmp.totalCount = 1;
    cmp.isLoading.set(false);
    const cb = ioCb();
    cb?.([{ isIntersecting: true }]);
    expect(mockBasicInfoService.loadNextPage).toHaveBeenCalled();

    cmp.hasUserScrolled = true;
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(el0.scrollTop).toBe(900);

    cmp.hasUserScrolled = false;
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(el0.scrollTop).toBe(900);

    Object.defineProperty(cmp, 'tableContainer', {
      value: undefined,
      configurable: true,
    });
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);
    await new Promise((r) => setTimeout(r, 0));

    const disconnect = vi.fn();
    cmp.io = { disconnect };
    cmp.ngOnDestroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('reposiciona para newTop quando perto do fim e houve scroll', async () => {
    const { cmp } = createCmp();
    const el: any = cmp.tableContainer.nativeElement;
    setScroll(el, 900, 1000, 900);
    cmp.hasUserScrolled = true;
    mockBasicInfoService.loading$.next(true);
    mockBasicInfoService.loading$.next(false);
    await new Promise((res) => setTimeout(res, 0));
    expect(el.scrollTop).toBe(100);
  });

  it('paginação e locks', () => {
    const { cmp } = createCmp();

    mockBasicInfoService.page$ = new BehaviorSubject(1);
    cmp.onChangePage(2);
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
    cmp.lastProcessedPage = 2;
    mockBasicInfoService.page$ = new BehaviorSubject(2);
    cmp.onChangePage(2);

    mockBasicInfoService.changePage.mockClear();
    mockBasicInfoService.page$ = new BehaviorSubject(2);
    cmp.lastProcessedPage = 0;
    cmp.onChangePage(2);
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
    expect(cmp.lastProcessedPage).toBe(2);

    mockBasicInfoService.changePage.mockClear();
    mockBasicInfoService.page$ = new BehaviorSubject(3);
    cmp.lastProcessedPage = 0;
    cmp.onChangePage('2' as any);
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);

    cmp.rasLocked = true;
    cmp.onChangePageSize(24);
    expect(mockBasicInfoService.changePageSize).not.toHaveBeenCalled();
    cmp.rasLocked = false;
    cmp.manualLocked = false;
    cmp.onChangePageSize(24);
    expect(mockBasicInfoService.changePageSize).toHaveBeenCalledWith(24);

    cmp.page$ = new BehaviorSubject(3);
    cmp.rasLocked = false;
    cmp.manualLocked = false;
    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
    mockBasicInfoService.changePage.mockClear();
    cmp.page$ = new BehaviorSubject(1);
    cmp.onPrevPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();

    cmp.page$ = new BehaviorSubject(1);
    cmp.totalCount = 24;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).toHaveBeenCalledWith(2);
    mockBasicInfoService.changePage.mockClear();
    cmp.page$ = new BehaviorSubject(2);
    cmp.totalCount = 24;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();

    mockBasicInfoService.changePage.mockClear();
    cmp.rasLocked = true;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
    cmp.rasLocked = false;
    cmp.manualLocked = true;
    cmp.onNextPage();
    expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();

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

  it('seleção e exclusões', () => {
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

  it('applyRAS com id válido e trim', async () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '  XYZ  ';
    cmp.manualLocked = false;
    mockGetDealRasService.getDealRas.mockReturnValue(of({} as any));
    cmp.applyRAS();
    await Promise.resolve();
    expect(mockGetDealRasService.getDealRas).toHaveBeenCalledWith('XYZ');
  });

  it('apply/confirm/cancel RAS', () => {
    const { cmp } = createCmp();
    cmp.dealRAS = '';
    cmp.applyRAS();
    expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');

    cmp.dealRAS = 'ABC123';
    cmp.manualLocked = true;
    cmp.applyRAS();
    expect(cmp.showConfirmRas).toBe(true);

    cmp.dealRAS = '';
    cmp.showConfirmRas = true;
    cmp.confirmApplyRAS();
    expect(cmp.showConfirmRas).toBe(false);

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

    cmp.showConfirmRas = true;
    cmp.cancelApplyRAS();
    expect(cmp.showConfirmRas).toBe(false);
  });

  it('performApplyRAS sucesso e erro', async () => {
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

    mockGetDealRasService.getDealRas.mockReturnValue(
      throwError(() => new Error('x')),
    );
    cmp.performApplyRAS('ABC123');
    await new Promise((r) => setTimeout(r, 0));
    expect(cmp.dealRASStatus).toBe('Erro ao buscar');
  });

  it('toggleShowRAS alterna e reseta locks', () => {
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

  it('buscar/limpar respeita locks e parâmetros', () => {
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

  it('ngAfterViewInit container/sentinel nulos e scroll fora do fim', async () => {
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

    const { cmp: cmp2 } = createCmp();
    const el: any = cmp2.tableContainer.nativeElement;
    cmp2.currentCount = 10;
    cmp2.totalCount = 20;
    cmp2.isLoading.set(false);
    setScroll(el, 100, 1000, 100);
    el.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 100));
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();

    vi.clearAllMocks();
    Object.defineProperty(cmp2, 'infiniteSentinel', {
      value: { nativeElement: null },
      configurable: true,
    });
    cmp2.ngAfterViewInit();
    expect((window as any).IntersectionObserver).toBeDefined();
    expect(ioCb()).toBeUndefined();

    const cb = ioCb();
    const { cmp: cmp3 } = createCmp();
    cmp3.currentCount = 0;
    cmp3.totalCount = 5;
    cmp3.isLoading.set(false);
    cb?.([{ isIntersecting: false }]);
    expect(mockBasicInfoService.loadNextPage).not.toHaveBeenCalled();
  });

  it.each([
    [
      { NewContract: '   ', BaseContract: 'BCX' },
      (c: any) => c.chave === 'BCX',
    ],
    [
      { NewContract: '', BaseContract: '', Account: 'ACCX' },
      (c: any) => c.chave === 'ACCX',
    ],
  ])(
    'mapDealRasToContrato chave por prioridade',
    (res: any, check: (c: any) => boolean) => {
      const { cmp } = createCmp();
      const c = (cmp as any).mapDealRasToContrato(res);
      expect(check(c)).toBe(true);
    },
  );

  it('mapDealRasToContrato chave usa dealRAS quando anteriores nulos', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = 'DRS1';
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('DRS1');
  });

  it.each([
    [{ ProductCanonical: 'OperX' }, (c: any) => c.operacao === 'OperX'],
    [
      { ProductCanonical: '   ', UseOfProceedsCanonical: 'UOPX' },
      (c: any) => c.operacao === 'UOPX',
    ],
    [
      { ProductCanonical: '', UseOfProceedsCanonical: '', Book: 'BKX' },
      (c: any) => c.operacao === 'BKX',
    ],
    [{ ProductCanonical: '', Book: 'BKX' }, (c: any) => c.operacao === 'BKX'],
  ])(
    'mapDealRasToContrato operacao por prioridade',
    (res: any, check: (c: any) => boolean) => {
      const { cmp } = createCmp();
      const c = (cmp as any).mapDealRasToContrato(res);
      expect(check(c)).toBe(true);
    },
  );

  it('mapDealRasToContrato id usa ras-DRS-ID quando dealRAS preenchido', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = 'DRS-ID';
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.id).toBe('ras-DRS-ID');
  });

  it("mapDealRasToContrato id usa 'ras-unk' quando dealRAS vazio", () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = '';
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.id).toBe('ras-unk');
  });

  it('mapDealRasToContrato chave usa "-" quando dealRAS undefined', () => {
    const { cmp } = createCmp();
    (cmp as any).dealRAS = undefined;
    const res: any = { NewContract: null, BaseContract: null, Account: null };
    const c = (cmp as any).mapDealRasToContrato(res);
    expect(c.chave).toBe('-');
  });

  it('mapDealRasToContrato fallback quando tudo nulo', () => {
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

  it.each([null, undefined])(
    'confirmApplyRAS retorna cedo quando dealRAS inválido: %s',
    (val: any) => {
      const { cmp } = createCmp();
      (cmp as any).dealRAS = val;
      cmp.showConfirmRas = true;
      mockGetDealRasService.getDealRas.mockClear();
      cmp.confirmApplyRAS();
      expect(cmp.dealRASStatus).toBe('Informe o Deal RAS');
      expect(cmp.showConfirmRas).toBe(false);
      expect(mockGetDealRasService.getDealRas).not.toHaveBeenCalled();
    },
  );

  it('formatIsoToInput cobre válidos e sentinelas', () => {
    const { cmp } = createCmp();
    expect(cmp.formatIsoToInput('2024-02-29T12:34:56Z')).toBe('2024-02-29');
    expect(cmp.formatIsoToInput('0001-01-01T00:00:00Z')).toBe('');
    expect(cmp.formatIsoToInput('not-a-date' as any)).toBe('');
    expect(cmp.formatIsoToInput(null as any)).toBe('');
  });

  it('formatIsoToInput cobre catch via Date inválido', () => {
    const { cmp } = createCmp();
    const OriginalDate = Date;
    (globalThis as { Date: typeof Date }).Date = class extends OriginalDate {
      constructor(arg?: unknown) {
        if (arg === 'invalid-date-format') throw new Error('Invalid date');
        super(arg as string);
      }
    } as unknown as typeof Date;
    expect(cmp.formatIsoToInput('invalid-date-format' as any)).toBe('');
    global.Date = OriginalDate as any;
  });

  it.each([
    [true, false],
    [false, true],
  ])(
    'onPrevPage respeita locks',
    (rasLocked: boolean, manualLocked: boolean) => {
      const { cmp } = createCmp();
      cmp.page$ = new BehaviorSubject(3);
      cmp.rasLocked = rasLocked;
      cmp.manualLocked = manualLocked;
      mockBasicInfoService.changePage.mockClear();
      cmp.onPrevPage();
      expect(mockBasicInfoService.changePage).not.toHaveBeenCalled();
    },
  );
});
