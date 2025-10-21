import { Injectable, signal, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Contrato, ContratoApi, ContratosApiResponse, TipoBaixa } from './models';

@Injectable({ providedIn: 'root' })
export class BasicInfoService {
  private readonly contratosSubject = new BehaviorSubject<Contrato[]>([]);
  private readonly totalSubject = new BehaviorSubject<number>(0);
  private readonly pageSubject = new BehaviorSubject<number>(1);
  private readonly pageSizeSubject = new BehaviorSubject<number>(12);
  private readonly selectedSubject = new BehaviorSubject<Contrato | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly contratos$: Observable<Contrato[]> =
    this.contratosSubject.asObservable();

  readonly total$: Observable<number> = this.totalSubject.asObservable();
  readonly page$: Observable<number> = this.pageSubject.asObservable();
  readonly pageSize$: Observable<number> = this.pageSizeSubject.asObservable();
  readonly selectedContrato$: Observable<Contrato | null> =
    this.selectedSubject.asObservable();

  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  readonly tiposBaixa: TipoBaixa[] = [
    { label: 'Manual', value: 'manual' },
    { label: 'Automática', value: 'automatica' },
  ];

  protected filtro = signal<string>('');
  protected apenasNaoVinculados = signal<boolean>(false);

  private currentContratos: Contrato[] = [];

  private readonly http = inject(HttpClient);

  searchContratos(
    filtro: string,
    apenasNaoVinculados: boolean,
    page = 1,
    pageSize = 12,
  ): void {
    const isLoadingMore =
      page > 1 &&
      this.filtro() === filtro &&
      this.apenasNaoVinculados() === apenasNaoVinculados;

    if (!isLoadingMore) {
      this.filtro.set(filtro);
      this.apenasNaoVinculados.set(apenasNaoVinculados);
      this.currentContratos = [];
    }

    this.loadingSubject.next(true);

    const params = new HttpParams()
      .set('filtro', filtro)
      .set('apenasNaoVinculados', apenasNaoVinculados.toString())
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    this.http
      .get<ContratosApiResponse>('/api/contratos', { params })
      .subscribe({
        next: (response: ContratosApiResponse): void => {
          const contratos = response.data.map((api) => ({
            id: api.id,
            chave: api.chave,
            operacao: api.operacao,
            vinculoTrade: api.vinculoTrade,
            acao: api.acao,
          }));

          if (page === 1) {
            this.currentContratos = contratos;
          } else {
            this.currentContratos = [...this.currentContratos, ...contratos];
          }

          this.pageSubject.next(page);
          this.pageSizeSubject.next(pageSize);

          this.contratosSubject.next(this.currentContratos);
          this.totalSubject.next(response.total);
          this.loadingSubject.next(false);
        },
        error: (): void => {
          this.contratosSubject.next([]);
          this.totalSubject.next(0);
          this.loadingSubject.next(false);
        },
      });
  }

  changePage(page: number): void {
    this.searchContratos(
      this.filtro(),
      this.apenasNaoVinculados(),
      page,
      this.pageSizeSubject.value,
    );
  }

  changePageSize(pageSize: number): void {
    this.searchContratos(
      this.filtro(),
      this.apenasNaoVinculados(),
      1,
      pageSize,
    );
  }

  selectContrato(contrato: Contrato): void {
    this.selectedSubject.next(contrato);
  }

  clearSelection(): void {
    this.selectedSubject.next(null);
  }

  loadNextPage(): void {
    const currentPage = this.pageSubject.value;
    const nextPage = currentPage + 1;
    this.changePage(nextPage);
  }

  getCurrentPage(): number {
    const currentPage = this.pageSubject.value;

    return currentPage;
  }
}
