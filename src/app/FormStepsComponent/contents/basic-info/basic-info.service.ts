import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface Contrato {
  id: string;
  chave: string;
  operacao: string;
  vinculoTrade: string;
  acao: string;
}

export interface ContratoApi {
  id: string;
  chave: string;
  operacao: string;
  vinculoTrade: string;
  acao: string;
}

export interface ContratosApiResponse {
  data: ContratoApi[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TipoBaixa {
  label: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class BasicInfoService {
  private readonly contratosSubject = new BehaviorSubject<Contrato[]>([]);
  private readonly totalSubject = new BehaviorSubject<number>(0);
  private readonly pageSubject = new BehaviorSubject<number>(1);
  private readonly pageSizeSubject = new BehaviorSubject<number>(12);
  private readonly selectedSubject = new BehaviorSubject<Contrato | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly contratos$: Observable<Contrato[]> = this.contratosSubject.asObservable();
  readonly total$: Observable<number> = this.totalSubject.asObservable();
  readonly page$: Observable<number> = this.pageSubject.asObservable();
  readonly pageSize$: Observable<number> = this.pageSizeSubject.asObservable();
  readonly selectedContrato$: Observable<Contrato | null> = this.selectedSubject.asObservable();
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  readonly tiposBaixa: TipoBaixa[] = [
    { label: 'Manual', value: 'manual' },
    { label: 'Automática', value: 'automatica' },
  ];

  // Estado de filtro atual
  protected filtro = signal<string>('');
  protected apenasNaoVinculados = signal<boolean>(false);
  
  // Estado para scroll infinito
  private currentContratos: Contrato[] = [];

  constructor(private http: HttpClient) {
    // Serviço inicializado sem dados
  }

  searchContratos(filtro: string, apenasNaoVinculados: boolean, page: number = 1, pageSize: number = 12): void {
    console.log('🔍 [SERVICE] searchContratos iniciado com parâmetros:', {
      filtro,
      apenasNaoVinculados,
      page,
      pageSize
    });

    // Para paginação infinita, não resetamos os filtros se estivermos carregando mais páginas
    const isLoadingMore = page > 1 && 
                         this.filtro() === filtro && 
                         this.apenasNaoVinculados() === apenasNaoVinculados;
    
    console.log('📊 [SERVICE] Análise de carregamento:', {
      isLoadingMore,
      filtroAtual: this.filtro(),
      apenasNaoVinculadosAtual: this.apenasNaoVinculados(),
      contratosAtuais: this.currentContratos.length
    });
    
    if (!isLoadingMore) {
      console.log('🔄 [SERVICE] Nova busca - resetando filtros e dados');
      this.filtro.set(filtro);
      this.apenasNaoVinculados.set(apenasNaoVinculados);
      this.currentContratos = []; // Limpa dados anteriores para nova busca
    } else {
      console.log('➕ [SERVICE] Carregamento incremental - mantendo dados existentes');
      console.log('📊 [SERVICE] Dados existentes que serão mantidos:', this.currentContratos.length);
    }
    
    this.loadingSubject.next(true);
    console.log('⏳ [SERVICE] Iniciando busca');

    // Constrói parâmetros da requisição
    const params = new HttpParams()
      .set('filtro', filtro)
      .set('apenasNaoVinculados', apenasNaoVinculados.toString())
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    console.log('🌐 [SERVICE] Fazendo requisição HTTP com parâmetros:', params.toString());

    this.http.get<ContratosApiResponse>('/api/contratos', { params }).subscribe({
      next: (response) => {
        console.log('✅ [SERVICE] Resposta HTTP recebida:', response);
        
        const contratos = response.data.map(api => ({
          id: api.id,
          chave: api.chave,
          operacao: api.operacao,
          vinculoTrade: api.vinculoTrade,
          acao: api.acao
        }));

        console.log('🔄 [SERVICE] Contratos mapeados:', contratos);

        // Para paginação infinita, acumula os dados se não for a primeira página
        if (page === 1) {
          console.log('📄 [SERVICE] Página 1 - substituindo dados');
          this.currentContratos = contratos;
        } else {
          console.log('📄 [SERVICE] Página > 1 - acumulando dados');
          console.log('📊 [SERVICE] Dados antes da acumulação:', this.currentContratos.length);
          this.currentContratos = [...this.currentContratos, ...contratos];
          console.log('📊 [SERVICE] Dados após acumulação:', this.currentContratos.length);
        }
        
        console.log('📋 [SERVICE] Lista final de contratos:', this.currentContratos);
        
        // Atualiza o estado da página APÓS receber os dados
        this.pageSubject.next(page);
        this.pageSizeSubject.next(pageSize);

        this.contratosSubject.next(this.currentContratos);
        this.totalSubject.next(response.total);
        this.loadingSubject.next(false);
        
        console.log(`📊 [SERVICE] Estado final atualizado:`, {
          page,
          pageSize,
          totalContratos: this.currentContratos.length,
          totalDisponivel: response.total
        });
      },
      error: (error) => {
        console.error('❌ [SERVICE] Erro na busca de contratos:', error);
        this.contratosSubject.next([]);
        this.totalSubject.next(0);
        this.loadingSubject.next(false);
        console.log('🔄 [SERVICE] Estado resetado devido ao erro');
      }
    });
  }

  changePage(page: number): void {
    console.log('📄 [SERVICE] changePage chamado com página:', page);
    console.log('📊 [SERVICE] Estado atual antes da mudança:', {
      paginaAtual: this.pageSubject.value,
      filtroAtual: this.filtro(),
      apenasNaoVinculadosAtual: this.apenasNaoVinculados(),
      contratosAtuais: this.currentContratos.length
    });
    
    this.searchContratos(this.filtro(), this.apenasNaoVinculados(), page, this.pageSizeSubject.value);
  }

  changePageSize(pageSize: number): void {
    console.log('📏 [SERVICE] changePageSize chamado com tamanho:', pageSize);
    console.log('🔄 [SERVICE] Resetando para página 1 devido à mudança de tamanho');
    
    this.searchContratos(this.filtro(), this.apenasNaoVinculados(), 1, pageSize);
  }

  selectContrato(contrato: Contrato) {
    this.selectedSubject.next(contrato);
  }

  clearSelection() {
    this.selectedSubject.next(null);
  }

  loadNextPage(): void {
    const currentPage = this.pageSubject.value;
    const nextPage = currentPage + 1;
    
    console.log('➡️ [SERVICE] loadNextPage chamado');
    console.log('📊 [SERVICE] Carregando próxima página:', {
      paginaAtual: currentPage,
      proximaPagina: nextPage,
      contratosAtuais: this.currentContratos.length,
      filtroAtual: this.filtro(),
      apenasNaoVinculadosAtual: this.apenasNaoVinculados()
    });
    
    this.changePage(nextPage);
  }

  getCurrentPage(): number {
    const currentPage = this.pageSubject.value;
    console.log('📖 [SERVICE] getCurrentPage retornando:', currentPage);
    return currentPage;
  }
}