import { Directive, HostListener, Input, inject } from '@angular/core';
import { StepperService } from '../stepper.service';
import { StepperComponent } from '../stepper.component';

@Directive({ selector: '[ftsStepperPrev]', standalone: true })
export class StepperPrevDirective {
  @Input() stepperPrev?: StepperComponent | StepperService;

  private readonly serviceOpt = inject(StepperService, { optional: true });

  private resolveService(): StepperService | null {
    if (this.stepperPrev instanceof StepperComponent) return this.stepperPrev.service;

    if (this.stepperPrev && typeof (this.stepperPrev as StepperService).prev === 'function')
      return this.stepperPrev as StepperService;

    return this.serviceOpt ?? null;
  }

  @HostListener('click') async onClick(): Promise<void> {
    const svc = this.resolveService();

    if (!svc) return;

    await svc.prev();
  }
}
