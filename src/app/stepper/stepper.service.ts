import { Injectable, signal, computed, effect } from '@angular/core';
import type { StepKey, StepRegistration, StepStatus } from './stepper.types';

@Injectable()
export class StepperService {
  private readonly steps = signal<StepRegistration[]>([]);

  readonly currentIndex = signal(0);

  readonly stepCount = computed(() => this.steps().length);

  readonly aliasToIndex = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};

    for (const s of this.steps()) {
      if (s.alias) {
        map[s.alias] = s.index;
      }
    }

    return map;
  });

  readonly stepStatuses = signal<Record<number, StepStatus>>({});

  readonly stepData = signal<Record<StepKey, unknown>>({});

  // Track if steps have been visited (entered at least once)
  readonly visitedSteps = signal<Record<number, boolean>>({});

  // Marca erros aplicados automaticamente ao pular steps não visitados
  // Esses erros devem ser limpos ao visitar e sair do step, exceto se houver validação customizada que mantenha o erro
  private readonly syntheticErrors = signal<Record<number, boolean>>({});

  // Linear mode flag to enforce sequential navigation
  readonly linear = signal(false);
  // Debug flag to control console logging
  readonly debug = signal(false);

  // Configure linear mode flag
  setLinear(flag: boolean): void {
    this.linear.set(!!flag);
  }

  // Configure debug flag
  setDebug(flag: boolean): void {
    this.debug.set(!!flag);
  }

  constructor() {
    // Keep active status in sync with current index WITHOUT creating a feedback loop
    effect(() => {
      const idx = this.currentIndex();
      const count = this.stepCount();
      // Mark current step as visited
      this.visitedSteps.update(prev => ({ ...prev, [idx]: true }));
      this.stepStatuses.update(prev => {
        const statuses = { ...prev };

        for (let i = 0; i < count; i++) {
          if (i === idx) {
            // Do NOT override a step that already has a persistent icon (finished or error)
            if (statuses[i] === undefined || statuses[i] === 'pending') {
              statuses[i] = 'active';
            }
            // if it's finished or error, keep as is to preserve the icon
          } else {
            if (statuses[i] === undefined) {
              statuses[i] = 'pending';
            }
          }
        }

        return statuses;
      });
    });
  }

  registerStep(
    index: number,
    alias?: string,
    meta?: Partial<Omit<StepRegistration, 'index'>>,
  ): void {
    // alias duplication => throw
    if (alias) {
      const existing = this.aliasToIndex()[alias];

      if (existing !== undefined) {
        throw new Error(`Alias duplicado: '${alias}'. Cada step deve ter um alias único.`);
      }
    }

    const list = [...this.steps()];
    const statuses = { ...this.stepStatuses() };

    // Add or update
    if (list.some(s => s.index === index)) {
      // Update existing registration
      for (const s of list) {
        if (s.index === index) {
          s.title = meta?.title ?? s.title;
          s.tooltip = meta?.tooltip ?? s.tooltip;
          s.cssClass = meta?.cssClass ?? s.cssClass;
          s.componentType = meta?.componentType ?? s.componentType;
          s.lazyLoader = meta?.lazyLoader ?? s.lazyLoader;
          s.contentTemplate = meta?.contentTemplate ?? s.contentTemplate;
          s.contentHtml = meta?.contentHtml ?? s.contentHtml;
          s.canEnter = meta?.canEnter ?? s.canEnter;
          s.canExit = meta?.canExit ?? s.canExit;
          // REMOVIDO: (s as any).hasCustomValidation = (meta as any)?.hasCustomValidation ?? (s as any).hasCustomValidation;
          // Overrides
          s.successIcon = meta?.successIcon ?? s.successIcon;
          s.errorIcon = meta?.errorIcon ?? s.errorIcon;
          s.successIconClass = meta?.successIconClass ?? s.successIconClass;
          s.errorIconClass = meta?.errorIconClass ?? s.errorIconClass;
          s.successIconColor = meta?.successIconColor ?? s.successIconColor;
          s.errorIconColor = meta?.errorIconColor ?? s.errorIconColor;
          s.successTitleClass = meta?.successTitleClass ?? s.successTitleClass;
          s.errorTitleClass = meta?.errorTitleClass ?? s.errorTitleClass;
          s.successTitleColor = meta?.successTitleColor ?? s.successTitleColor;
          s.errorTitleColor = meta?.errorTitleColor ?? s.errorTitleColor;
          s.successTooltip = meta?.successTooltip ?? s.successTooltip;
          s.errorTooltip = meta?.errorTooltip ?? s.errorTooltip;
          // Flags de exibição de ícones
          s.showIconOnFinished = meta?.showIconOnFinished ?? s.showIconOnFinished;
          s.showIconOnError = meta?.showIconOnError ?? s.showIconOnError;
        }
      }
    } else {
      const reg: StepRegistration = {
        index,
        alias,
        title: meta?.title,
        tooltip: meta?.tooltip,
        cssClass: meta?.cssClass,
        componentType: meta?.componentType ?? null,
        lazyLoader: meta?.lazyLoader ?? null,
        contentTemplate: meta?.contentTemplate ?? null,
        contentHtml: meta?.contentHtml ?? null,
        canEnter: meta?.canEnter,
        canExit: meta?.canExit,
        // Overrides
        successIcon: meta?.successIcon,
        errorIcon: meta?.errorIcon,
        successIconClass: meta?.successIconClass,
        errorIconClass: meta?.errorIconClass,
        successIconColor: meta?.successIconColor,
        errorIconColor: meta?.errorIconColor,
        successTitleClass: meta?.successTitleClass,
        errorTitleClass: meta?.errorTitleClass,
        successTitleColor: meta?.successTitleColor,
        errorTitleColor: meta?.errorTitleColor,
        successTooltip: meta?.successTooltip,
        errorTooltip: meta?.errorTooltip,
        // Flags de exibição de ícones
        showIconOnFinished: meta?.showIconOnFinished,
        showIconOnError: meta?.showIconOnError,
      } as StepRegistration;
      // REMOVIDO: (reg as any).hasCustomValidation = (meta as any)?.hasCustomValidation ?? false;
      list.push(reg);
    }

    this.steps.set(list);

    // ensure statuses record has entries
    if (statuses[index] === undefined) statuses[index] = 'pending';

    this.stepStatuses.set(statuses);

    // Adjust currentIndex if needed
    if (this.currentIndex() >= this.stepCount()) {
      this.currentIndex.set(Math.max(0, this.stepCount() - 1));
    }
  }

  unregisterStep(index: number, _alias?: string): void {
    // marcar parâmetro como intencionalmente não utilizado
    void _alias;
    const list = this.steps().filter(s => s.index !== index);
    this.steps.set(list);

    const statuses = { ...this.stepStatuses() };
    delete statuses[index];
    this.stepStatuses.set(statuses);

    // Clean alias map implicitly via computed
    // Adjust currentIndex if needed
    if (this.currentIndex() >= this.stepCount()) {
      this.currentIndex.set(Math.max(0, this.stepCount() - 1));
    }
  }

  async next(): Promise<boolean> {
    return this.goTo(this.currentIndex() + 1);
  }

  async prev(): Promise<boolean> {
    return this.goTo(this.currentIndex() - 1);
  }

  async goTo(target: number | string): Promise<boolean> {
    const count = this.stepCount();

    if (count <= 0) return false;

    const idx = typeof target === 'number' ? target : this.aliasToIndex()[target];

    if (idx === undefined || idx < 0 || idx >= count) return false;

    const currentIdx = this.currentIndex();

    // Resolve registros e alias para logs
    const list = this.steps();
    const currentStep = list.find(s => s.index === currentIdx);

    // debug logs removed to comply with linting rules

    // Guard de saída: permite aplicar validações/estados ao deixar o passo atual
    if (currentStep?.canExit) {
      try {
        const ok = await currentStep.canExit(this);

        // debug logs removed

        if (ok === false) {
          // debug logs removed

          return false;
        }
      } catch {
        // debug logs removed
        // Em caso de erro, não bloquear navegação mas seguir adiante
      }
    }

    const statuses = { ...this.stepStatuses() };
    const visited = { ...this.visitedSteps() };
    const synthetic = { ...this.syntheticErrors() };
    // current was visited as part of canExit evaluation
    visited[currentIdx] = true;

    // Se navegável e o destino for adiante, marcar todos os anteriores como finished (exceto erros)
    if (idx > currentIdx) {
      for (let i = 0; i < idx; i++) {
        const st = statuses[i];
        const wasVisited = !!visited[i];

        if (!wasVisited) {
          // regra nova: apontar erro em steps não acessados
          statuses[i] = 'error';
          synthetic[i] = true; // erro sintético aplicado por salto

          // debug logs removed
        } else {
          // Se erro era sintético e o step possui validação customizada (canExit),
          // não limpar automaticamente: deixar o erro e marcar como não-sintético.
          const stepReg = list.find(s => s.index === i);

          if (st === 'error' && synthetic[i]) {
            if (stepReg?.canExit) {
              statuses[i] = 'error';
              synthetic[i] = false; // passa a ser erro governado pela validação customizada
            } else {
              statuses[i] = 'finished';
              synthetic[i] = false;
            }
          } else {
            statuses[i] = st === 'error' ? 'error' : 'finished';
          }
        }
      }
    } else if (idx < currentIdx) {
      // Voltando: não limpar validação, apenas remover 'active' do atual
      if (statuses[currentIdx] === 'active') {
        statuses[currentIdx] = 'finished';
      }
    }

    // Ativar o destino sem alterar ícones anteriores se já houver finished/error
    if (statuses[idx] === undefined || statuses[idx] === 'pending' || statuses[idx] === 'active') {
      statuses[idx] = 'active';
    }

    this.stepStatuses.set(statuses);
    this.syntheticErrors.set(synthetic);
    // debug logs removed

    // marcar destino como visitado
    visited[idx] = true;
    this.visitedSteps.set(visited);
    // debug logs removed

    this.currentIndex.set(idx);

    return true;
  }

  reset(options?: { keepData?: boolean; index?: number }): void {
    const idx = options?.index ?? 0;
    const statuses: Record<number, StepStatus> = {};

    for (let i = 0; i < this.stepCount(); i++) {
      statuses[i] = i === idx ? 'active' : 'pending';
    }

    this.stepStatuses.set(statuses);
    this.currentIndex.set(Math.min(Math.max(idx, 0), Math.max(this.stepCount() - 1, 0)));

    if (!options?.keepData) this.stepData.set({});

    // reset de visitados: somente o índice inicial como visitado
    const visited: Record<number, boolean> = {};
    visited[idx] = true;
    this.visitedSteps.set(visited);
    // limpar erros sintéticos
    this.syntheticErrors.set({});
  }

  saveData(key: StepKey, payload: unknown): void {
    const data = { ...this.stepData() };
    data[key] = payload;
    this.stepData.set(data);
  }

  getData<T = unknown>(key: StepKey): T | undefined {
    return this.stepData()[key] as T | undefined;
  }

  // helper de debug: emitir no log o valor daquele step
  logData(key: StepKey, _prefix = '[Stepper]'): void {
    // debug helper suppressed to comply with lint rules
    void _prefix;
    void this.getData(key);
  }

  setStatus(key: StepKey, status: StepStatus): void {
    const index = typeof key === 'number' ? key : this.aliasToIndex()[key];

    if (index === undefined) return;

    const statuses = { ...this.stepStatuses() };
    statuses[index] = status;
    this.stepStatuses.set(statuses);
  }

  getSteps(): StepRegistration[] {
    return this.steps();
  }
}
