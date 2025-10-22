/* eslint-disable max-lines */
import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Table, TableColumn } from 'fts-frontui/table';
import { Loading } from 'fts-frontui/loading';
import { i18n } from 'fts-frontui/i18n';
import { BasicInfoService } from './basic-info.service';
import { GetDealRasService } from './services/get-deal-ras.service';
import { DealRasResponse, Contrato } from './models';
import { Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { auditTime, takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: '[fts-basic-info]',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, i18n, Table, TableColumn, Loading],
  templateUrl: './basic-info.component.html',
  styleUrl: './basic-info.component.css',
})
export class BasicInfoComponent implements AfterViewInit, OnDestroy {
  private readonly svc = inject(BasicInfoService);
  private readonly fb = inject(FormBuilder);
  private readonly dealRasSvc = inject(GetDealRasService);
  showras = false;

  @ViewChild('tableContainer', { static: false })
  private tableContainer?: ElementRef<HTMLDivElement>;

  @ViewChild('infiniteSentinel', { static: false })
  private infiniteSentinel?: ElementRef<HTMLDivElement>;

  private readonly destroy$ = new Subject<void>();
  private isLoading = false;
  private currentCount = 0;
  private totalCount = 0;
  private readonly scrollThresholdPct = 90;
  private prevBottomOffset = 0;
  private io?: IntersectionObserver;
  private hasUserScrolled = false;
  private wasNearBottomBeforeLoad = false;
  private prevScrollTop = 0;

  protected dealRAS = '';
  protected dealRASStatus = '-';
  protected searchText = '';
  protected onlyNotLinked = false;

  protected rasLocked = false;
  protected manualLocked = false;
  protected manualContratos: Contrato[] = [];
  protected rasContratos: Contrato[] = [];
  protected showConfirmRas = false;

  protected readonly contratos$ = this.svc.contratos$;
  protected readonly total$ = this.svc.total$;
  protected readonly page$ = this.svc.page$;
  protected readonly pageSize$ = this.svc.pageSize$;
  protected readonly selected$ = this.svc.selectedContrato$;
  protected readonly loading$ = this.svc.loading$;
  protected readonly rasLoading$ = new BehaviorSubject<boolean>(false);

  protected readonly form = this.fb.group({
    dataContrato: ['', [Validators.required]],
    dataInicioVigencia: ['', [Validators.required]],
    tipoBaixa: [null as unknown, [Validators.required]],
  });

  protected readonly tiposBaixa = this.svc.tiposBaixa;

  constructor() {
    // Campos do formulário devem permanecer sempre editáveis
    this.form.enable({ emitEvent: false });

    this.contratos$.subscribe(contratos => {
      this.currentCount = contratos?.length || 0;
    });

    this.total$.subscribe(total => {
      this.totalCount = total || 0;
    });

    this.loading$.subscribe(isLoading => {
      const wasLoading = this.isLoading;
      this.isLoading = !!isLoading;

      if (!wasLoading && this.isLoading) {
        const el = this.tableContainer?.nativeElement ?? null;

        if (el) {
          this.prevScrollTop = el.scrollTop;
          const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
          this.prevBottomOffset = Math.max(remaining, 0);
          this.wasNearBottomBeforeLoad = this.prevBottomOffset <= 48;
        }
      }

      if (wasLoading && !this.isLoading) {
        setTimeout(() => {
          const el = this.tableContainer?.nativeElement ?? null;

          if (!el) return;

          if (this.wasNearBottomBeforeLoad && this.hasUserScrolled) {
            const newTop = el.scrollHeight - el.clientHeight - this.prevBottomOffset;
            el.scrollTop = Math.max(newTop, 0);
          } else {
            el.scrollTop = this.prevScrollTop;
          }
        }, 0);
      }
    });
  }

  ngAfterViewInit(): void {
    const container = this.tableContainer?.nativeElement ?? null;

    if (!container) return;

    fromEvent(container, 'scroll')
      .pipe(auditTime(50), takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasUserScrolled = true;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const atBottom = scrollTop + clientHeight >= scrollHeight * 0.99;

        if (atBottom && this.currentCount < this.totalCount && !this.isLoading) {
          this.onLoadMore();
        }
      });

    const sentinel = this.infiniteSentinel?.nativeElement ?? null;

    if (sentinel) {
      this.io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.currentCount < this.totalCount && !this.isLoading) {
            this.onLoadMore();
          }
        });
      });
      this.io.observe(sentinel);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.io?.disconnect();
  }

  onBuscar(): void {
    if (this.rasLocked || this.manualLocked) return;

    this.svc.searchContratos(this.searchText, this.onlyNotLinked, 1, 12);
  }

  clearSearch(): void {
    if (this.rasLocked || this.manualLocked) return;

    this.searchText = '';
    this.onlyNotLinked = false;
    this.svc.searchContratos(this.searchText, this.onlyNotLinked, 1, 12);
  }

  toggleShowRAS(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.showras = !!input?.checked;

    if (!this.showras) {
      this.resetRASLock();
      this.rasLoading$.next(false);
    }
  }

  private formatIsoToInput(iso: string | null | undefined): string {
    if (!iso) return '';

    if (iso.startsWith('0001-01-01')) return '';

    try {
      const d = new Date(iso);

      if (isNaN(d.getTime())) return '';

      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');

      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  }

  private mapDealRasToContrato(res: DealRasResponse): Contrato {
    const chave =
      res?.NewContract?.trim() ||
      res?.BaseContract?.trim() ||
      res?.Account?.trim() ||
      String(this.dealRAS ?? '').trim() ||
      '-';

    const operacao =
      res?.ProductCanonical?.trim() ||
      res?.UseOfProceedsCanonical?.trim() ||
      res?.Book?.trim() ||
      '-';

    return {
      id: `ras-${String(this.dealRAS ?? '').trim() || 'unk'}`,
      chave,
      operacao,
      vinculoTrade: 'Não vinculado',
      acao: 'Excluir',
    };
  }

  private applyRasToForm(res: DealRasResponse): void {
    const disp = this.formatIsoToInput(res?.DisbursementDate);
    const mat = this.formatIsoToInput(res?.MaturityDate);

    this.form.patchValue({
      dataInicioVigencia: disp,
      dataContrato: mat,
    });
  }

  applyRAS(): void {
    const id = (this.dealRAS ?? '').trim();

    if (!id) {
      this.dealRASStatus = 'Informe o Deal RAS';

      return;
    }

    if (this.manualLocked) {
      // Abre modal de confirmação (Bootstrap) ao invés de window.confirm
      this.showConfirmRas = true;

      return;
    }

    this.performApplyRAS(id);
  }

  confirmApplyRAS(): void {
    const id = (this.dealRAS ?? '').trim();

    if (!id) {
      this.dealRASStatus = 'Informe o Deal RAS';
      this.showConfirmRas = false;

      return;
    }

    // Limpa seleção manual para garantir exclusividade
    this.onExcluirSelecionado();
    this.showConfirmRas = false;
    this.performApplyRAS(id);
  }

  cancelApplyRAS(): void {
    this.showConfirmRas = false;
  }

  private performApplyRAS(id: string): void {
    this.dealRASStatus = 'Carregando...';
    this.rasLoading$.next(true);
    this.dealRasSvc
      .getDealRas(id)
      .pipe(finalize(() => this.rasLoading$.next(false)))
      .subscribe({
        next: (res: DealRasResponse) => {
          this.applyRasToForm(res);
          // Exclusividade: ativa lock RAS e garante que lock manual não esteja ativo
          this.rasLocked = true;
          this.manualLocked = false;
          this.manualContratos = [];
          this.svc.clearSelection();
          this.rasContratos = [this.mapDealRasToContrato(res)];
          this.dealRASStatus = 'OK';
        },
        error: () => {
          this.dealRASStatus = 'Erro ao buscar';
        },
      });
  }

  private lastProcessedPage = 0;

  onChangePage(page: number | string): void {
    const pageNumber = Number(page);

    if (this.lastProcessedPage === pageNumber) {
      return;
    }

    this.svc.page$
      .subscribe(currentPage => {
        if (pageNumber > currentPage) {
          this.lastProcessedPage = pageNumber;
          this.svc.changePage(pageNumber);
        } else if (pageNumber < currentPage) {
          this.lastProcessedPage = pageNumber;
          this.svc.changePage(pageNumber);
        } else {
          this.lastProcessedPage = pageNumber;
        }
      })
      .unsubscribe();
  }

  onChangePageSize(size: number): void {
    if (this.rasLocked || this.manualLocked) return;

    this.svc.changePageSize(Number(size));
  }

  onLoadMore(): void {
    if (this.rasLocked || this.manualLocked) return;

    this.svc.loadNextPage();
  }

  onSelect(row: Contrato): void {
    if (this.rasLocked) return;

    this.svc.selectContrato(row);
    this.manualLocked = true;
    this.manualContratos = [row];
  }

  onPrevPage(): void {
    if (this.rasLocked || this.manualLocked) return;

    this.page$
      .subscribe(currentPage => {
        if (currentPage > 1) {
          this.svc.changePage(currentPage - 1);
        }
      })
      .unsubscribe();
  }

  onNextPage(): void {
    if (this.rasLocked || this.manualLocked) return;

    this.page$
      .subscribe(currentPage => {
        const nextPage = currentPage + 1;
        const maxPages = Math.ceil(this.totalCount / 12);

        if (nextPage <= maxPages) {
          this.svc.changePage(nextPage);
        }
      })
      .unsubscribe();
  }

  onExcluirRAS(): void {
    this.resetRASLock();
  }

  onExcluirSelecionado(): void {
    this.manualLocked = false;
    this.manualContratos = [];
    this.svc.clearSelection();
  }

  private resetRASLock(): void {
    this.rasLocked = false;
    this.rasContratos = [];
    this.dealRASStatus = '-';
  }
}
