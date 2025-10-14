import { Component, computed, effect, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Table, TableColumn } from 'fts-frontui/table';
import { Loading } from 'fts-frontui/loading';
import { i18n } from 'fts-frontui/i18n';
import { BasicInfoService, Contrato } from './basic-info.service';
import { Subject, fromEvent } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-basic-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, i18n, Table, TableColumn, Loading],
  templateUrl: './basic-info.component.html',
  styleUrl: './basic-info.component.css'
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
  private scrollEl: HTMLElement | null = null;
  private prevBottomOffset = 0;
  private io?: IntersectionObserver;
  private hasUserScrolled = false;
  private wasNearBottomBeforeLoad = false;
  private prevScrollTop = 0;

  // Integrações
  protected dealRAS = '';

  // Busca
  protected searchText = '';
  protected onlyNotLinked = false;

  // Observables da tabela
  protected readonly contratos$ = this.svc.contratos$;
  protected readonly total$ = this.svc.total$;
  protected readonly page$ = this.svc.page$;
  protected readonly pageSize$ = this.svc.pageSize$;
  protected readonly selected$ = this.svc.selectedContrato$;
  protected readonly loading$ = this.svc.loading$;

  // Form
  protected readonly form = this.fb.group({
    dataContrato: [{ value: '', disabled: true }, [Validators.required]],
    dataInicioVigencia: [{ value: '', disabled: true }, [Validators.required]],
    tipoBaixa: [{ value: null as unknown, disabled: true }, [Validators.required]],
  });

  protected readonly tiposBaixa = this.svc.tiposBaixa;

  constructor() {
    // Não carrega dados iniciais - tabela inicia vazia
    // this.svc.searchContratos('', false, 1, 12);
    
    console.log('🏗️ BasicInfoComponent constructor - Inicializando componente');
    
    // Habilita/desabilita formulário com base na seleção
    this.svc.selectedContrato$.subscribe((sel) => {
      console.log('👤 Seleção de contrato alterada:', sel);
      if (sel) {
        this.form.enable({ emitEvent: false });
        console.log('✅ Formulário habilitado');
      } else {
        this.form.disable({ emitEvent: false });
        console.log('❌ Formulário desabilitado');
      }
    });

    // Log para monitorar mudanças nos contratos e atualizar contagem atual
    this.contratos$.subscribe((contratos) => {
      console.log('📊 Contratos atualizados - Total:', contratos?.length || 0);
      console.log('📋 Lista de contratos:', contratos);
      this.currentCount = contratos?.length || 0;
    });

    // Log para monitorar total de itens e atualizar contagem total
    this.total$.subscribe((total) => {
      console.log('🔢 Total de itens disponíveis:', total);
      this.totalCount = total || 0;
    });

    // Log para monitorar página atual
    this.page$.subscribe((page) => {
      console.log('📄 Página atual:', page);
    });

    // Rastreia estado de loading para evitar chamadas duplicadas e preservar posição do scroll
    this.loading$.subscribe(isLoading => {
      // Atualiza flag
      const wasLoading = this.isLoading;
      this.isLoading = !!isLoading;

      // Antes de iniciar carregamento, guarda offset em relação ao fundo
      if (!wasLoading && this.isLoading) {
        const el = this.getScrollContainer();
        if (el) {
          this.prevScrollTop = el.scrollTop;
          const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
          this.prevBottomOffset = Math.max(remaining, 0);
          this.wasNearBottomBeforeLoad = this.prevBottomOffset <= 48; // considera "perto do fim"
        }
      }

      // Após concluir carregamento, restaura posição evitando pulo para o topo
      if (wasLoading && !this.isLoading) {
        setTimeout(() => {
          const el = this.getScrollContainer();
          if (!el) return;
          if (this.wasNearBottomBeforeLoad && this.hasUserScrolled) {
            const newTop = el.scrollHeight - el.clientHeight - this.prevBottomOffset;
            el.scrollTop = Math.max(newTop, 0);
          } else {
            // Mantém posição anterior (evita começar no fundo quando não houve rolagem do usuário)
            el.scrollTop = this.prevScrollTop;
          }
        }, 0);
      }
    });
  }

  onBuscar() {
    console.log('🔍 onBuscar chamado!');
    console.log('📝 Parâmetros de busca:', {
      searchText: this.searchText,
      onlyNotLinked: this.onlyNotLinked
    });
    console.log('🔄 Resetando para página 1 e limpando dados anteriores');
    this.svc.searchContratos(this.searchText, this.onlyNotLinked, 1, 12);
  }

  clearSearch() {
    console.log('🧹 clearSearch chamado - Limpando campo de busca');
    this.searchText = '';
  }

  private lastProcessedPage = 0; // Controle para evitar loops

  onChangePage(page: number | string) {
    const pageNumber = Number(page);
    console.log('🔄 onChangePage chamado com página:', pageNumber);
    console.log('📊 Estado atual antes da mudança:', {
      lastProcessedPage: this.lastProcessedPage,
      currentPage: this.svc.getCurrentPage(),
      totalContratos: this.svc['currentContratos']?.length || 0
    });
    
    // Evita processar a mesma página repetidamente
    if (this.lastProcessedPage === pageNumber) {
      console.log(`🚫 Página ${pageNumber} já foi processada, ignorando`);
      return;
    }
    
    // Para paginação infinita, sempre permite carregar páginas maiores
    this.svc.page$.subscribe(currentPage => {
      console.log(`📄 Comparando páginas - Solicitada: ${pageNumber}, Atual: ${currentPage}`);
      if (pageNumber > currentPage) {
        console.log(`📄 Carregando mais dados - página ${pageNumber} (atual: ${currentPage})`);
        this.lastProcessedPage = pageNumber;
        this.svc.changePage(pageNumber);
      } else if (pageNumber < currentPage) {
        console.log(`📄 Navegando para página anterior ${pageNumber} (atual: ${currentPage})`);
        this.lastProcessedPage = pageNumber;
        this.svc.changePage(pageNumber);
      } else {
        console.log(`⚠️ Já estamos na página ${pageNumber}, ignorando chamada`);
        this.lastProcessedPage = pageNumber;
      }
    }).unsubscribe();
  }

  onChangePageSize(size: number) {
    console.log('📏 onChangePageSize chamado com tamanho:', size);
    console.log('🔄 Resetando dados e voltando para página 1');
    this.svc.changePageSize(Number(size));
  }

  onLoadMore(event: any): void {
    console.log('🔄 Load More clicado!');
    console.log('📊 Estado antes do loadMore:', {
      currentPage: this.svc.getCurrentPage(),
      totalContratos: this.svc['currentContratos']?.length || 0
    });
    this.svc.loadNextPage();
  }

  onSelect(row: Contrato) {
    console.log('👆 Contrato selecionado:', row);
    this.svc.selectContrato(row);
  }

  // Navegação simples de página (mantida para compatibilidade)
  onPrevPage() {
    this.page$.subscribe(currentPage => {
      const prev = currentPage - 1;
      if (prev >= 1) this.svc.changePage(prev);
    }).unsubscribe();
  }

  onNextPage() {
    this.page$.subscribe(currentPage => {
      const next = currentPage + 1;
      this.svc.changePage(next);
    }).unsubscribe();
  }

  // IntersectionObserver: carrega próxima página quando o sentinel entrar na viewport do container
  ngAfterViewInit(): void {
    this.initIntersectionObserver();
  }

  private getScrollContainer(): HTMLElement | null {
    return this.tableContainer?.nativeElement ?? null;
  }

  private initIntersectionObserver(): void {
    const container = this.getScrollContainer();
    const sentinel = this.infiniteSentinel?.nativeElement ?? null;
    if (!container || !sentinel) {
      console.warn('⚠️ Container ou sentinel não encontrado para IntersectionObserver');
      return;
    }

    // Guarda referência do container
    this.scrollEl = container;

    // Desconecta anterior
    if (this.io) {
      this.io.disconnect();
    }

    // Observa quando o sentinel entra próximo ao fim do container
    this.io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const hasMore = this.currentCount < this.totalCount;
            const canTrigger = !this.isLoading && hasMore;
            const root = this.scrollEl as HTMLElement | null;
            const notScrollable = !root || root.scrollHeight <= root.clientHeight;
            // Gate: só dispara após rolagem do usuário e se houver overflow
            if (canTrigger && this.hasUserScrolled && !notScrollable) {
              console.log('👀 Sentinel visível — carregando próxima página');
              this.svc.loadNextPage();
              // Desarma até próxima rolagem do usuário para evitar carregamento contínuo
              this.hasUserScrolled = false;
            }
          }
        }
      },
      {
        root: container,
        rootMargin: '0px 0px 0px 0px',
        threshold: 0,
      }
    );

    this.io.observe(sentinel);

    // Disparo a 90% do fim baseado no scroll do container
    fromEvent(container, 'scroll')
      .pipe(auditTime(100), takeUntil(this.destroy$))
      .subscribe(() => {
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const scrollHeight = container.scrollHeight;
        const consumedPct = ((scrollTop + clientHeight) / Math.max(scrollHeight, 1)) * 100;
        const hasMore = this.currentCount < this.totalCount;
        const canTrigger = !this.isLoading && hasMore && consumedPct >= this.scrollThresholdPct;

        if (canTrigger) {
          console.log(`⬇️ Scroll ${consumedPct.toFixed(1)}% — carregando próxima página`);
          this.svc.loadNextPage();
          // Evita novo disparo imediato; precisa de nova rolagem do usuário
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