/* eslint-disable max-lines */

import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  Renderer2,
  ViewChild,
  computed,
  inject,
  OnChanges,
} from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { StepperService } from './stepper.service';
import { StepComponent } from './step.component';
import type { StepChangeEvent, StepRegistration, StepStatus } from './stepper.types';

@Component({
  selector: '[fts-stepper]',
  standalone: true,
  imports: [CommonModule, NgbTooltip],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [StepperService],
  exportAs: 'ftsStepper',
})
export class StepperComponent implements AfterContentInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() linear = false;
  @Input() navigable = false;
  @Input() stepperClass?: string;
  @Input() stepListClass?: string;
  @Input() stepItemClass?: string;
  @Input() stepIconClass?: string;
  @Input() stepTitleClass?: string;
  @Input() stepContentClass?: string;
  @Input() segments?: number; // número de gomos da barra de progresso (opcional)

  @Output() stepChange = new EventEmitter<StepChangeEvent>();

  @ContentChildren(StepComponent) private readonly projectedSteps!: QueryList<StepComponent>;

  readonly service = inject(StepperService);
  private readonly renderer = inject(Renderer2);
  private readonly host = inject(ElementRef);

  @ViewChild('progressWrapperRef') private progressWrapper?: ElementRef<HTMLElement>;
  @ViewChild('iconsRef') private iconsRef?: ElementRef<HTMLElement>;
  @ViewChild('titlesRef') private titlesRef?: ElementRef<HTMLElement>;
  @ViewChild('separatorsRef') private separatorsRef?: ElementRef<HTMLElement>;
  private resizeUnlisten?: () => void;

  readonly progressPercent = computed(() => {
    const total = this.segments ?? this.service.stepCount();

    if (!total) return 0;

    // Evitar overshoot entre gomos: não arredondar o percentual
    const percent = ((this.service.currentIndex() + 1) / total) * 100;

    return percent; // número com casas decimais para corresponder exatamente ao limite do segmento
  });

  // Substituir por getter simples (evita conflito e o erro "steps is not a function")
  get steps(): StepRegistration[] {
    return this.service.getSteps();
  }

  private lastChangeKey: number | string = 0;

  ngAfterContentInit(): void {
    // Sync linear flag into service
    this.service.setLinear(this.linear);

    const list = this.projectedSteps.toArray();
    list.forEach((step, index) => {
      step.__assignIndex(index);
      step.__registerWithService();
    });
  }

  ngAfterViewInit(): void {
    // Ajusta colunas dos ícones e títulos para largura real da barra
    this.updateGridColumns();
    // Recalcula em resize
    this.resizeUnlisten = this.renderer.listen('window', 'resize', () => this.updateGridColumns());
  }

  private updateGridColumns(): void {
    const segments = this.segments ?? this.service.stepCount();

    if (!segments || segments <= 0) return;

    const wrapper = this.progressWrapper?.nativeElement;
    const width =
      wrapper?.getBoundingClientRect().width ??
      (this.host.nativeElement as HTMLElement).getBoundingClientRect().width;

    if (!width || width <= 0) return;

    const col = `${width / segments}px`;
    const grid = `repeat(${segments}, ${col})`;

    if (this.iconsRef?.nativeElement)
      this.renderer.setStyle(this.iconsRef.nativeElement, 'gridTemplateColumns', grid);

    if (this.titlesRef?.nativeElement)
      this.renderer.setStyle(this.titlesRef.nativeElement, 'gridTemplateColumns', grid);

    // Alinhar separadores com a mesma métrica de segmento em px
    if (this.separatorsRef?.nativeElement) {
      this.renderer.setStyle(this.separatorsRef.nativeElement, '--segment-size', col);
    }
  }

  ngOnChanges(): void {
    this.service.setLinear(this.linear);
  }

  ngOnDestroy(): void {
    if (this.resizeUnlisten) {
      this.resizeUnlisten();
      this.resizeUnlisten = undefined;
    }
  }

  async onStepClick(index: number): Promise<void> {
    if (!this.navigable) return;

    await this.service.goTo(index);
  }

  onStepKeydown(event: KeyboardEvent, index: number): void {
    if (!this.navigable) return;

    const key = event.key;

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      event.preventDefault();
      this.service.goTo(index + 1);
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      event.preventDefault();
      this.service.goTo(index - 1);
    } else if (key === 'Home') {
      event.preventDefault();
      this.service.goTo(0);
    } else if (key === 'End') {
      event.preventDefault();
      this.service.goTo(this.service.stepCount() - 1);
    }
  }

  getStepClasses(step: StepRegistration): string[] {
    const statuses = this.service.stepStatuses();
    const s: StepStatus = statuses[step.index] ?? 'pending';
    const statusClass = `step-status-${s}`;
    const base = ['step', statusClass];

    if (this.stepItemClass) base.push(this.stepItemClass);

    if (step.cssClass) base.push(step.cssClass);

    return base;
  }

  getTitleClasses(step: StepRegistration): string[] {
    const statuses = this.service.stepStatuses();
    const s: StepStatus = statuses[step.index] ?? 'pending';
    const base: string[] = [];

    if (this.stepTitleClass) base.push(this.stepTitleClass);

    if (s === 'finished' && step.successTitleClass) base.push(step.successTitleClass);

    if (s === 'error' && step.errorTitleClass) base.push(step.errorTitleClass);

    return base;
  }

  getTitleColor(step: StepRegistration): string | null {
    const statuses = this.service.stepStatuses();
    const s: StepStatus = statuses[step.index] ?? 'pending';

    if (s === 'finished') return step.successTitleColor ?? null;

    if (s === 'error') return step.errorTitleColor ?? null;

    return null;
  }

  getIconClass(step: StepRegistration): string | null {
    const statuses = this.service.stepStatuses();
    const s: StepStatus = statuses[step.index] ?? 'pending';

    if (s === 'finished') {
      const base = step.successIcon;
      const extra = step.successIconClass;

      return [base ?? 'bi bi-check-circle-fill', extra].filter(Boolean).join(' ');
    }

    if (s === 'error') {
      const base = step.errorIcon;
      const extra = step.errorIconClass;

      return [base ?? 'bi bi-exclamation-circle-fill', extra].filter(Boolean).join(' ');
    }

    return null;
  }

  shouldShowIcon(step: StepRegistration): boolean {
    const statuses = this.service.stepStatuses();
    const s: StepStatus = statuses[step.index] ?? 'pending';

    if (s === 'finished') return step.showIconOnFinished ?? true;

    if (s === 'error') return step.showIconOnError ?? true;

    return false;
  }

  getIconColor(step: StepRegistration): string | null {
    const statuses = this.service.stepStatuses();
    const s: StepStatus = statuses[step.index] ?? 'pending';

    if (s === 'finished') return step.successIconColor ?? null;

    if (s === 'error') return step.errorIconColor ?? null;

    return null;
  }

  getTooltip(step: StepRegistration): string | null {
    const statuses = this.service.stepStatuses();
    const s: StepStatus = statuses[step.index] ?? 'pending';

    if (s === 'finished') return step.successTooltip ?? step.tooltip ?? 'STEPPER_SUCCESS_TOOLTIP';

    if (s === 'error') return step.errorTooltip ?? step.tooltip ?? 'STEPPER_ERROR_TOOLTIP';

    return step.tooltip ?? 'STEPPER_STEP_TOOLTIP';
  }

  getProgressAriaLabel(): string {
    return 'STEPPER_PROGRESS_LABEL';
  }

  isFirst(): boolean {
    return this.service.currentIndex() === 0;
  }

  isLast(): boolean {
    return this.service.currentIndex() >= this.service.stepCount() - 1;
  }
}
