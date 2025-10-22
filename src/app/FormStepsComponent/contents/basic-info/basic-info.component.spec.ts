import { describe, it, expect, vi, beforeEach, afterEach, vitest } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
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
});
