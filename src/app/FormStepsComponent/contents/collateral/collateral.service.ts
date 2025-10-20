import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Garantia {
  id: string;
  tipo: string;
  tickerOuNome: string;
  garantidor: string;
  conta: string;
  vinculado: boolean;
  pu: number;
  qtdAlocada: number;
  valor: number;
  lendingValue: number;
  emissor: string;
  codIsin: string;
  codAtivo: string;
  status: string;
}

@Injectable()
export class CollateralService {
  // dataset completo em memória (mock)
  private readonly garantiasSubject = new BehaviorSubject<Garantia[]>([]);
  private readonly pageSubject = new BehaviorSubject<number>(1);
  private readonly pageSizeSubject = new BehaviorSubject<number>(12);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  // observables de consumo no template
  readonly garantias$ = this.garantiasSubject.asObservable();
  readonly page$ = this.pageSubject.asObservable();
  readonly pageSize$ = this.pageSizeSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  // totais e paginação derivada
  readonly total$ = this.garantias$.pipe(
    map((arr) => arr.reduce((s, g) => s + (g.valor || 0), 0)),
  );

  readonly pagedGarantias$ = combineLatest([
    this.garantias$,
    this.page$,
    this.pageSize$,
  ]).pipe(
    map(([arr, page, size]) => {
      const start = (page - 1) * size;
      return arr.slice(start, start + size);
    }),
  );

  addGarantia(g: Omit<Garantia, 'id' | 'status'> & { status?: string }): void {
    const id = crypto.randomUUID();
    const nova: Garantia = {
      status: g.status ?? 'Dados completos',
      ...g,
      id,
    };
    const next = [...this.garantiasSubject.value, nova];
    this.garantiasSubject.next(next);
  }

  removeGarantia(id: string): void {
    const next = this.garantiasSubject.value.filter((x) => x.id !== id);
    this.garantiasSubject.next(next);
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

  // stub simples para importação (somente marca loading)
  importarArquivo(_file: File): void {
    this.startLoading();
    setTimeout(() => this.stopLoading(), 600);
  }
}