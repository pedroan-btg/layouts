import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Table, TableColumn } from 'fts-frontui/table';
import { Loading } from 'fts-frontui/loading';
import { i18n } from 'fts-frontui/i18n';
import { BasicInfoService, Contrato } from './basic-info.service';
import { GetDealRasService } from './services/get-deal-ras.service';
import { DealRasResponse } from './models';
import { Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { auditTime, takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: '[fts-basic-info]',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    i18n,
    Table,
    TableColumn,
    Loading,
  ],
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

  protected readonly contratos$ = this.svc.contratos$;
  protected readonly total$ = this.svc.total$;
  protected readonly page$ = this.svc.page$;
  protected readonly pageSize$ = this.svc.pageSize$;
  protected readonly selected$ = this.svc.selectedContrato$;
  protected readonly loading$ = this.svc.loading$;
  protected readonly rasLoading$ = new BehaviorSubject<boolean>(false);

  protected readonly form = this.fb.group({
    dataContrato: [{ value: '', disabled: true }, [Validators.required]],
    dataInicioVigencia: [{ value: '', disabled: true }, [Validators.required]],
    tipoBaixa: [
      { value: null as unknown, disabled: true },
      [Validators.required],
    ],
  });

  protected readonly tiposBaixa = this.svc.tiposBaixa;

  constructor() {
    this.svc.selectedContrato$.subscribe((sel) => {
      if (sel) {
        this.form.enable({ emitEvent: false });
      } else {
        this.form.disable({ emitEvent: false });
      }
    });

    this.contratos$.subscribe((contratos) => {
      this.currentCount = contratos?.length || 0;
    });

    this.total$.subscribe((total) => {
      this.totalCount = total || 0;
    });

    this.loading$.subscribe((isLoading) => {
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
            const newTop =
              el.scrollHeight - el.clientHeight - this.prevBottomOffset;
            el.scrollTop = Math.max(newTop, 0);
          } else {
            el.scrollTop = this.prevScrollTop;
          }
        }, 0);
      }
    });
  }

  onBuscar(): void {
    this.svc.searchContratos(this.searchText, this.onlyNotLinked, 1, 12);
  }

  clearSearch(): void {
    this.searchText = '';
    this.onlyNotLinked = false;
    this.svc.searchContratos(this.searchText, this.onlyNotLinked, 1, 12);
  }

  toggleShowRAS(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.showras = !!input?.checked;
    if (!this.showras) {
      this.rasLoading$.next(false);
    }
  }

  applyRAS(): void {
    const id = (this.dealRAS ?? '').trim();

    if (!id) {
      this.dealRASStatus = 'Informe o Deal RAS';

      return;
    }

    this.dealRASStatus = 'Carregando...';
    this.rasLoading$.next(true);
    this.dealRasSvc
      .getDealRas(id)
      .pipe(finalize(() => this.rasLoading$.next(false)))
      .subscribe({
        next: (res: DealRasResponse) => {
          const status = res?.status ?? 'OK';
          this.dealRASStatus = String(status);
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
      .subscribe((currentPage) => {
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
    this.svc.changePageSize(Number(size));
  }

  onLoadMore(): void {
    this.svc.loadNextPage();
  }

  onSelect(row: Contrato): void {
    this.svc.selectContrato(row);
  }

  onPrevPage(): void {
    this.page$
      .subscribe((currentPage) => {
        if (currentPage > 1) {
          this.svc.changePage(currentPage - 1);
        }
      })
      .unsubscribe();
  }

  onNextPage(): void {
    this.page$
      .subscribe((currentPage) => {
        const nextPage = currentPage + 1;
        const maxPages = Math.ceil(this.totalCount / 12);

        if (nextPage <= maxPages) {
          this.svc.changePage(nextPage);
        }
      })
      .unsubscribe();
  }

  ngAfterViewInit(): void {
    fromEvent(window, 'scroll')
      .pipe(auditTime(200), takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasUserScrolled = true;
      });

    this.initIntersectionObserver();
  }

  private initIntersectionObserver(): void {
    if (!this.infiniteSentinel) return;

    this.io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.isLoading) {
          const el = this.tableContainer?.nativeElement ?? null;

          if (!el) return;

          const scrollPct =
            (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;

          if (scrollPct >= this.scrollThresholdPct) {
            this.onLoadMore();
          }
        }
      });
    });

    this.io.observe(this.infiniteSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.io?.disconnect();
  }
}
