import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Collateral, CollateralPayload } from './models';

@Injectable()
export class CollateralService {
  // full dataset in memory (mock)
  private readonly collateralsSubject = new BehaviorSubject<Collateral[]>([]);
  private readonly pageSubject = new BehaviorSubject<number>(1);
  private readonly pageSizeSubject = new BehaviorSubject<number>(12);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  // observables for template consumption
  readonly collaterals$ = this.collateralsSubject.asObservable();
  readonly page$ = this.pageSubject.asObservable();
  readonly pageSize$ = this.pageSizeSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  // totals and derived pagination
  readonly total$ = this.collaterals$.pipe(
    map((arr) => arr.reduce((sum, c) => sum + (c.value || 0), 0)),
  );

  readonly pagedCollaterals$ = combineLatest([
    this.collaterals$,
    this.page$,
    this.pageSize$,
  ]).pipe(
    map(([arr, page, size]) => {
      const start = (page - 1) * size;

      return arr.slice(start, start + size);
    }),
  );

  addCollateral(payload: CollateralPayload): void {
    const id = crypto.randomUUID();
    const nextItem: Collateral = {
      status: payload.status ?? 'Complete data',
      ...payload,
      id,
    };
    const next = [...this.collateralsSubject.value, nextItem];
    this.collateralsSubject.next(next);
  }

  removeCollateral(id: string): void {
    const next = this.collateralsSubject.value.filter((x) => x.id !== id);
    this.collateralsSubject.next(next);
  }

  changePage(page: number): void {
    this.pageSubject.next(page);
  }

  changePageSize(size: number): void {
    this.pageSizeSubject.next(size);
    this.pageSubject.next(1);
  }

  startLoading(): void {
    this.loadingSubject.next(true);
  }

  stopLoading(): void {
    this.loadingSubject.next(false);
  }

  // simple stub for import (only toggles loading)
  importFile(file: File): void {
    this.startLoading();
    void file;
    setTimeout(() => this.stopLoading(), 600);
  }
}
