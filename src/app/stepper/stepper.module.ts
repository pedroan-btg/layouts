import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperComponent } from './stepper.component';
import { StepComponent } from './step.component';
import { StepperNextDirective } from './directives/stepper-next.directive';
import { StepperPrevDirective } from './directives/stepper-prev.directive';
import { StepperGoToDirective } from './directives/stepper-go-to.directive';

@NgModule({
  imports: [
    CommonModule,
    StepperComponent,
    StepComponent,
    StepperNextDirective,
    StepperPrevDirective,
    StepperGoToDirective,
  ],
  exports: [
    StepperComponent,
    StepComponent,
    StepperNextDirective,
    StepperPrevDirective,
    StepperGoToDirective,
  ],
})
export class StepperModule {}
