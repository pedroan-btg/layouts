import { Directive, HostListener, Input, inject } from '@angular/core';
import { StepperService } from '../stepper.service';
import { StepperComponent } from '../stepper.component';

@Directive({ selector: '[ftsStepperNext]', standalone: true })
export class StepperNextDirective {
  // Permite uso fora do escopo do <fts-stepper> passando uma referência
  // Ex.: <button [stepperNext]="stepper">Avançar</button> onde #stepper="ftsStepper"
  @Input() stepperNext?: StepperComponent | StepperService;

  private readonly serviceOpt = inject(StepperService, { optional: true });

  private resolveService(): StepperService | null {
    if (this.stepperNext instanceof StepperComponent)
      return this.stepperNext.service;

    if (
      this.stepperNext &&
      typeof (this.stepperNext as StepperService).next === 'function'
    )
      return this.stepperNext as StepperService;

    return this.serviceOpt ?? null;
  }

  @HostListener('click') async onClick(): Promise<void> {
    const svc = this.resolveService();

    if (!svc) return; // sem provider nem ref explícita

    await svc.next();
  }
}
