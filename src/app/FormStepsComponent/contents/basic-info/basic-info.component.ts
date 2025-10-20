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
import { Subject, fromEvent } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';

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
  protected searchText = '';
  protected onlyNotLinked = false;

  protected readonly contratos$ = this.svc.contratos$;
  protected readonly total$ = this.svc.total$;
  protected readonly page$ = this.svc.page$;
  protected readonly pageSize$ = this.svc.pageSize$;
  protected readonly selected$ = this.svc.selectedContrato$;
  protected readonly loading$ = this.svc.loading$;

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
        const prev = currentPage - 1;

        if (prev >= 1) this.svc.changePage(prev);
      })
      .unsubscribe();
  }

  onNextPage(): void {
    this.page$
      .subscribe((currentPage) => {
        const next = currentPage + 1;
        this.svc.changePage(next);
      })
      .unsubscribe();
  }

  ngAfterViewInit(): void {
    this.initIntersectionObserver();
  }

  private initIntersectionObserver(): void {
    const container = this.tableContainer?.nativeElement ?? null;
    const sentinel = this.infiniteSentinel?.nativeElement ?? null;

    if (!container || !sentinel) {
      return;
    }

    if (this.io) {
      this.io.disconnect();
    }

    this.io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const hasMore = this.currentCount < this.totalCount;
            const canTrigger = !this.isLoading && hasMore;
            const root = container as HTMLElement | null;
            const notScrollable =
              !root || root.scrollHeight <= root.clientHeight;

            if (canTrigger && this.hasUserScrolled && !notScrollable) {
              this.svc.loadNextPage();
              this.hasUserScrolled = false;
            }
          }
        }
      },
      {
        root: container,
        rootMargin: '0px 0px 0px 0px',
        threshold: 0,
      },
    );

    this.io.observe(sentinel);

    fromEvent(container, 'scroll')
      .pipe(auditTime(100), takeUntil(this.destroy$))
      .subscribe(() => {
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;
        const consumedPct =
          ((scrollTop + clientHeight) / Math.max(scrollHeight, 1)) * 100;
        const hasMore = this.currentCount < this.totalCount;
        const canTrigger =
          !this.isLoading && hasMore && consumedPct >= this.scrollThresholdPct;

        if (canTrigger) {
          this.svc.loadNextPage();
          this.hasUserScrolled = false;
        } else if (!this.isLoading) {
          this.hasUserScrolled = true;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.io) {
      this.io.disconnect();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
}
