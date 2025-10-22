import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  TemplateRef,
  Type,
  ViewChild,
  ViewContainerRef,
  inject,
  EventEmitter,
  EnvironmentInjector,
  OnDestroy,
  AfterViewInit,
  AfterViewChecked,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { StepperService } from './stepper.service';

@Component({
  selector: '[fts-step]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step.component.html',
})
export class StepComponent
  implements OnDestroy, AfterViewInit, AfterViewChecked
{
  @Input() alias?: string;
  @Input({ required: true }) title!: string;
  @Input() iconTooltip?: string;
  @Input() cssClass?: string;
  @Input() contentHtml?: string;
  @Input() contentTemplate?: TemplateRef<unknown>;
  @Input() componentType?: Type<unknown>;
  @Input() lazyLoader?: () => Promise<Type<unknown>>;
  // Allow passing props and outputs to the dynamic component
  @Input() componentInputs?: Record<string, unknown>;
  @Input() componentOutputs?: Record<string, (event: unknown) => void>;
  @Input() canEnter?: (ctx: StepperService) => boolean | Promise<boolean>;
  @Input() canExit?: (ctx: StepperService) => boolean | Promise<boolean>;
  @Input() onSave?: (ctx: StepperService) => unknown;
  // Overrides por status (sucesso/falha)
  @Input() successIcon?: string;
  @Input() errorIcon?: string;
  @Input() successIconClass?: string;
  @Input() errorIconClass?: string;
  @Input() successIconColor?: string;
  @Input() errorIconColor?: string;
  @Input() successTitleClass?: string;
  @Input() errorTitleClass?: string;
  @Input() successTitleColor?: string;
  @Input() errorTitleColor?: string;
  @Input() successTooltip?: string;
  @Input() errorTooltip?: string;
  // Controle de exibição de ícones por status
  @Input() showIconOnFinished?: boolean;
  @Input() showIconOnError?: boolean;
  // Flag para indicar validação customizada (exibe ícone diferenciado ao concluir)
  // REMOVIDO: @Input() hasCustomValidation?: boolean;

  // host container aparece apenas quando isActive === true (via template)
  private host?: ViewContainerRef;
  private _contentRendered = false;
  private _wasActive = false; // <-- ADICIONE ESTA LINHA

  @ViewChild('host', { read: ViewContainerRef, static: false }) set hostRef(
    vc: ViewContainerRef | undefined,
  ) {
    this.host = vc;

    // Se o host sumiu (step ficou inativo), reset da flag
    if (!vc && this._contentRendered) {
      this._contentRendered = false;
      this._wasActive = false;
    }

    // Quando o host aparece (step ficou ativo), renderizamos o conteúdo dinâmico
    /* c8 ignore next */
    if (this.host && this.isActive && !this._contentRendered) {
      // usar microtask para garantir que o container esteja estável
      Promise.resolve().then(() => {
        this.renderContent();
      });
    }
  }

  private readonly service = inject(StepperService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly envInjector = inject(EnvironmentInjector);

  private _index = -1;
  __assignIndex(i: number): void {
    this._index = i;
  }

  __registerWithService(): void {
    this.service.registerStep(this._index, this.alias, {
      title: this.title,
      tooltip: this.iconTooltip,
      cssClass: this.cssClass,
      componentType: this.componentType ?? null,
      lazyLoader: this.lazyLoader ?? null,
      contentTemplate: this.contentTemplate ?? null,
      contentHtml: this.contentHtml ?? null,
      canEnter: this.canEnter as unknown as (
        ctx: unknown,
      ) => boolean | Promise<boolean>,
      canExit: this.canExit as unknown as (
        ctx: unknown,
      ) => boolean | Promise<boolean>,
      // REMOVIDO: hasCustomValidation propagação
      // Overrides
      successIcon: this.successIcon,
      errorIcon: this.errorIcon,
      successIconClass: this.successIconClass,
      errorIconClass: this.errorIconClass,
      successIconColor: this.successIconColor,
      errorIconColor: this.errorIconColor,
      successTitleClass: this.successTitleClass,
      errorTitleClass: this.errorTitleClass,
      successTitleColor: this.successTitleColor,
      errorTitleColor: this.errorTitleColor,
      successTooltip: this.successTooltip,
      errorTooltip: this.errorTooltip,
      // Controle de ícones por status
      showIconOnFinished: this.showIconOnFinished,
      showIconOnError: this.showIconOnError,
    });
  }

  get isActive(): boolean {
    return this.service.currentIndex() === this._index;
  }
  // ngOnInit removido: render inicial agora em ngAfterViewInit

  ngOnDestroy(): void {
    this._contentRendered = false;
    const payload = this.onSave ? this.onSave(this.service) : { visited: true };
    const key = this.alias ?? this._index;
    this.service.saveData(key, payload);
    this.service.unregisterStep(this._index, this.alias);
    this.host?.clear();

    if (this._contentHtmlEl && this._contentHtmlEl.parentNode) {
      try {
        this._contentHtmlEl.parentNode.removeChild(this._contentHtmlEl);
      } catch {
        void 0;
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isActive && this.host && !this._contentRendered) {
      this.renderContent();
    }

    this._wasActive = this.isActive;
  }

  ngAfterViewChecked(): void {
    const nowActive = this.isActive;

    if (this._wasActive && !nowActive && this._contentRendered) {
      this._contentRendered = false;
    }

    this._wasActive = nowActive;
  }

  async renderContent(): Promise<void> {
    const host = this.host;

    if (!host) return;

    // Para contentHtml, permitir re-renderização se o conteúdo mudou
    const isContentHtmlReRender =
      this.contentHtml &&
      this._contentRendered &&
      this._lastContentHtml !== this.contentHtml;

    if (this._contentRendered && !isContentHtmlReRender) {
      return;
    }

    this._contentRendered = true;

    host.clear();

    if (this.componentType) {
      const ref = host.createComponent(this.componentType, {
        environmentInjector: this.envInjector,
      });

      if (this.componentInputs && ref?.instance) {
        Object.entries(this.componentInputs).forEach(([key, value]) => {
          (ref.instance as Record<string, unknown>)[key] = value as unknown;
        });
        ref.changeDetectorRef.markForCheck();
      }

      if (this.componentOutputs && ref?.instance) {
        Object.entries(this.componentOutputs).forEach(([key, handler]) => {
          const out = (ref.instance as Record<string, unknown>)[key];

          if (out instanceof EventEmitter && typeof handler === 'function') {
            out.subscribe((payload: unknown) => handler(payload));
          }
        });
      }

      return;
    }

    if (this.lazyLoader) {
      const t = await this.lazyLoader();
      const ref = host.createComponent(t, {
        environmentInjector: this.envInjector,
      });

      if (this.componentInputs && ref?.instance) {
        Object.entries(this.componentInputs).forEach(([key, value]) => {
          (ref.instance as Record<string, unknown>)[key] = value as unknown;
        });
        ref.changeDetectorRef.markForCheck();
      }

      if (this.componentOutputs && ref?.instance) {
        Object.entries(this.componentOutputs).forEach(([key, handler]) => {
          const out = (ref.instance as Record<string, unknown>)[key];

          if (out instanceof EventEmitter && typeof handler === 'function') {
            out.subscribe((payload: unknown) => handler(payload));
          }
        });
      }

      return;
    }

    if (this.contentTemplate) {
      const view = host.createEmbeddedView(this.contentTemplate);
      view.detectChanges();

      return;
    }

    if (this.contentHtml) {
      this._lastContentHtml = this.contentHtml; // Guardar o último conteúdo
      const safe: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
        this.contentHtml,
      );
      const el = document.createElement('div');
      el.innerHTML = String(safe);
      const anchor = host.element.nativeElement;
      const parent = anchor.parentNode as Node | null;

      if (parent) {
        if (this._contentHtmlEl && this._contentHtmlEl.parentNode) {
          this._contentHtmlEl.parentNode.removeChild(this._contentHtmlEl);
        }

        parent.insertBefore(el, anchor);
        this._contentHtmlEl = el;
      }
    }
  }

  private _contentHtmlEl?: HTMLElement;
  private _lastContentHtml?: string; // <-- ADICIONE ESTA LINHA
}
