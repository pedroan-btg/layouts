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
import { ElementRef } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ENV_CONFIG } from 'fts-frontui/env';
import { Component } from '@angular/core';

import { CollateralComponent } from './collateral.component';
import { CollateralService } from './collateral.service';
import { i18n } from 'fts-frontui/i18n';

// Mock do módulo modal para substituir o import real
vitest.mock('./modal/collateral-add-modal.component', () => ({
  CollateralAddModalComponent: Component({
    selector: '[fts-collateral-add-modal]',
    standalone: true,
    template: '<div>Mock Modal</div>',
  })(class {}),
}));

let mockSvc: any;
vitest.mock('./collateral.service', () => {
  const createMock = () => {
    const _collaterals$ = new BehaviorSubject<any[]>([]);
    const _page$ = new BehaviorSubject<number>(1);
    const _pageSize$ = new BehaviorSubject<number>(12);
    const _loading$ = new BehaviorSubject<boolean>(false);

    const _total$ = _collaterals$.pipe(
      map((arr) => arr.reduce((sum, c: any) => sum + (c?.value ?? 0), 0)),
    );
    const _pagedCollaterals$ = combineLatest([
      _collaterals$,
      _page$,
      _pageSize$,
    ]).pipe(
      map(([arr, page, size]) => {
        const start = (page - 1) * size;
        return arr.slice(start, start + size);
      }),
    );

    return {
      // streams consumidas no template
      collaterals$: _collaterals$,
      page$: _page$,
      pageSize$: _pageSize$,
      loading$: _loading$,
      total$: _total$,
      pagedCollaterals$: _pagedCollaterals$,
      // métodos usados pelo componente
      addCollateral: vi.fn(),
      removeCollateral: vi.fn(),
      changePage: vi.fn((n: number) => _page$.next(n)),
      changePageSize: vi.fn((n: number) => {
        _pageSize$.next(n);
        _page$.next(1);
      }),
      startLoading: vi.fn(() => _loading$.next(true)),
      stopLoading: vi.fn(() => _loading$.next(false)),
      importFile: vi.fn(),
      // helpers p/ testes
      __subjects: { _collaterals$, _page$, _pageSize$, _loading$ },
    };
  };
  return { CollateralService: vi.fn(() => (mockSvc = createMock())) };
});

describe('CollateralComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollateralComponent, i18n, HttpClientTestingModule],
      providers: [
        {
          provide: CollateralService,
          useValue: mockSvc,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: vi.fn() } },
            paramMap: new BehaviorSubject(new Map()),
          },
        },
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
    const fixture = TestBed.createComponent(CollateralComponent);
    const cmp = fixture.componentInstance as any;
    return { fixture, cmp };
  }

  it('should create component', () => {
    const { cmp } = createCmp();
    expect(cmp).toBeTruthy();
  });

  it('should open and close add modal', () => {
    const { cmp } = createCmp();
    expect(cmp.showAddModal).toBe(false);
    cmp.openAddModal();
    expect(cmp.showAddModal).toBe(true);
    cmp.closeAddModal();
    expect(cmp.showAddModal).toBe(false);
  });

  it('should call addCollateral on onModalSave and close modal', () => {
    const { cmp } = createCmp();
    cmp.showAddModal = true;
    const payload: any = { type: 'CDB', tickerOrName: 'X', value: 100 };
    cmp.onModalSave(payload);
    expect(mockSvc.addCollateral).toHaveBeenCalledWith(payload);
    expect(cmp.showAddModal).toBe(false);
  });

  it('should call removeCollateral on onDelete', () => {
    const { cmp } = createCmp();
    const row: any = { id: 'abc' };
    cmp.onDelete(row);
    expect(mockSvc.removeCollateral).toHaveBeenCalledWith('abc');
  });

  it('should call changePage and changePageSize converting values', () => {
    const { cmp } = createCmp();
    cmp.onChangePage('3');
    expect(mockSvc.changePage).toHaveBeenCalledWith(3);
    cmp.onChangePageSize(24);
    expect(mockSvc.changePageSize).toHaveBeenCalledWith(24);
  });

  it('should trigger fileInput click on onImport', () => {
    const { cmp } = createCmp();
    const clickMock = vi.fn();
    (cmp as any).fileInput = {
      nativeElement: { click: clickMock },
    } as unknown as ElementRef<HTMLInputElement>;
    cmp.onImport();
    expect(clickMock).toHaveBeenCalled();
  });

  it('should import file on onFileSelected when file exists', () => {
    const { cmp } = createCmp();
    const inputEl: any = { files: [{} as any], value: 'x' };
    const evt = { target: inputEl } as unknown as Event;
    cmp.onFileSelected(evt);
    expect(mockSvc.importFile).toHaveBeenCalled();
    expect(inputEl.value).toBe('');
  });

  it('should toggle menu with toggleMenu', () => {
    const { cmp } = createCmp();
    const row: any = { id: '1' };
    cmp.toggleMenu(row);
    expect(cmp.openedMenuId).toBe('1');
    cmp.toggleMenu(row);
    expect(cmp.openedMenuId).toBeNull();
  });

  it('should close menu on onDocClick when clicking outside', () => {
    const { cmp } = createCmp();
    cmp.openedMenuId = '1';
    const targetOutside: any = { closest: (sel: string) => null };
    cmp.onDocClick({ target: targetOutside } as any);
    expect(cmp.openedMenuId).toBeNull();
  });

  it('should not close menu on onDocClick when clicking inside', () => {
    const { cmp } = createCmp();
    cmp.openedMenuId = '1';
    const targetInside: any = {
      closest: (sel: string) => (sel === '.fts-row-menu' ? {} : null),
    };
    cmp.onDocClick({ target: targetInside } as any);
    expect(cmp.openedMenuId).toBe('1');
  });
});
