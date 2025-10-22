import { Directive, HostListener, Input, inject } from '@angular/core';
import { StepperService } from '../stepper.service';
import { StepperComponent } from '../stepper.component';

@Directive({ selector: '[ftsStepperGoTo]', standalone: true })
export class StepperGoToDirective {
  @Input() stepperGoTo!: number | string;
  @Input() stepperGoToRef?: StepperComponent | StepperService;

  private readonly serviceOpt = inject(StepperService, { optional: true });

  private resolveService(): StepperService | null {
    if (this.stepperGoToRef instanceof StepperComponent)
      return this.stepperGoToRef.service;

    if (
      this.stepperGoToRef &&
      typeof (this.stepperGoToRef as StepperService).goTo === 'function'
    ) {
      return this.stepperGoToRef as StepperService;
    }

    return this.serviceOpt ?? null;
  }

  @HostListener('click') async onClick(): Promise<void> {
    const svc = this.resolveService();

    if (!svc) return;

    await svc.goTo(this.stepperGoTo);
  }
}
