import { Component, signal } from '@angular/core';
import { FormStepsComponent } from './FormStepsComponent/form-steps.component';

@Component({
  selector: 'app-root',
  imports: [FormStepsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('layouts');
}
