import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ENV_CONFIG } from 'fts-frontui/env';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BasicInfoComponent } from './basic-info.component';
import { BasicInfoService } from './basic-info.service';
import { GetDealRasService } from './services/get-deal-ras.service';

export interface SetupCtx {
  mockBasicInfoService: {
    contratos$: BehaviorSubject<unknown[]>;
    total$: BehaviorSubject<number>;
    page$: BehaviorSubject<number>;
    pageSize$: BehaviorSubject<number>;
    selectedContrato$: BehaviorSubject<unknown>;
    loading$: BehaviorSubject<boolean>;
    tiposBaixa: { label: string; value: string }[];
    searchContratos: ReturnType<typeof vi.fn>;
    changePage: ReturnType<typeof vi.fn>;
    changePageSize: ReturnType<typeof vi.fn>;
    selectContrato: ReturnType<typeof vi.fn>;
    clearSelection: ReturnType<typeof vi.fn>;
    loadNextPage: ReturnType<typeof vi.fn>;
  };
  mockGetDealRasService: { getDealRas: ReturnType<typeof vi.fn> };
  createCmp: () => { fixture: unknown; cmp: unknown };
  setScroll: (
    el: HTMLElement & Record<string, unknown>,
    top: number,
    height: number,
    client: number,
  ) => void;
  ioCb: () => unknown;
}

export async function setupBasicInfoTest(): Promise<SetupCtx> {
  const mockBasicInfoService: SetupCtx['mockBasicInfoService'] = {
    contratos$: new BehaviorSubject<unknown[]>([]),
    total$: new BehaviorSubject<number>(0),
    page$: new BehaviorSubject<number>(1),
    pageSize$: new BehaviorSubject<number>(12),
    selectedContrato$: new BehaviorSubject<unknown>(null),
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
  const mockGetDealRasService: SetupCtx['mockGetDealRasService'] = {
    getDealRas: vi.fn(),
  };

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
    imports: [
      ReactiveFormsModule,
      CommonModule,
      RouterModule.forRoot([{ path: 'basic-info', component: BasicInfoComponent }]),
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
        useValue: { environment: 'test', version: '0.0.0', logDisabled: true },
      },
    ],
  })
    .overrideComponent(BasicInfoComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  vi.clearAllMocks();

  function createCmp(): { fixture: unknown; cmp: unknown } {
    const fixture: ComponentFixture<BasicInfoComponent> =
      TestBed.createComponent(BasicInfoComponent);
    const cmp = fixture.componentInstance as unknown;
    Object.defineProperty(cmp as Record<string, unknown>, 'tableContainer', {
      value: { nativeElement: document.createElement('div') },
      configurable: true,
    });
    Object.defineProperty(cmp as Record<string, unknown>, 'infiniteSentinel', {
      value: { nativeElement: document.createElement('div') },
      configurable: true,
    });
    fixture.detectChanges();

    return { fixture, cmp };
  }

  function setScroll(
    el: HTMLElement & Record<string, unknown>,
    top: number,
    height: number,
    client: number,
  ): void {
    Object.defineProperty(el, 'scrollTop', {
      value: top,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(el, 'scrollHeight', {
      value: height,
      configurable: true,
    });
    Object.defineProperty(el, 'clientHeight', {
      value: client,
      configurable: true,
    });
  }

  function ioCb(): unknown {
    return (mockIntersectionObserver.mock.calls as unknown as [unknown][])[0]?.[0];
  }

  return {
    mockBasicInfoService,
    mockGetDealRasService,
    createCmp,
    setScroll,
    ioCb,
  };
}
