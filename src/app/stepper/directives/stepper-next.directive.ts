import { Directive, HostListener, Input, inject } from '@angular/core';
import { StepperService } from '../stepper.service';
import { StepperComponent } from '../stepper.component';

@Directive({ selector: '[stepperNext]', standalone: true })
export class StepperNextDirective {
  // Permite uso fora do escopo do <app-stepper> passando uma referência
  // Ex.: <button [stepperNext]="stepper">Avançar</button> onde #stepper="appStepper"
  @Input('stepperNext') ref?: StepperComponent | StepperService;

  private readonly serviceOpt = inject(StepperService, { optional: true });

  private resolveService(): StepperService | null {
    if (this.ref instanceof StepperComponent) return this.ref.service;

    if (this.ref && typeof (this.ref as StepperService).next === 'function')
      return this.ref as StepperService;

    return this.serviceOpt ?? null;
  }

  @HostListener('click') async onClick(): Promise<void> {
    const svc = this.resolveService();

    if (!svc) return; // sem provider nem ref explícita

    await svc.next();
  }
}
