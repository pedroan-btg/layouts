import { Directive, HostListener, Input, inject } from '@angular/core';
import { StepperService } from '../stepper.service';
import { StepperComponent } from '../stepper.component';

@Directive({ selector: '[stepperGoTo]', standalone: true })
export class StepperGoToDirective {
  @Input() stepperGoTo!: number | string;
  @Input('stepperGoToRef') ref?: StepperComponent | StepperService;

  private readonly serviceOpt = inject(StepperService, { optional: true });

  private resolveService(): StepperService | null {
    if (this.ref instanceof StepperComponent) return this.ref.service;

    if (this.ref && typeof (this.ref as StepperService).goTo === 'function')
      return this.ref as StepperService;

    return this.serviceOpt ?? null;
  }

  @HostListener('click') async onClick(): Promise<void> {
    const svc = this.resolveService();

    if (!svc) return;

    await svc.goTo(this.stepperGoTo);
  }
}
