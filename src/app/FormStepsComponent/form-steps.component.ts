import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasicInfoComponent } from './contents/basic-info/basic-info.component';
import { GuaranteesComponent } from './contents/guarantees/guarantees.component';
import { CreditsComponent } from './contents/credits/credits.component';
import { DocumentsComponent } from './contents/documents/documents.component';
import { ReviewComponent } from './contents/review/review.component';

export type FormStep = {
  key: string;
  title: string;
  description: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-form-steps',
  standalone: true,
  imports: [
    CommonModule,
    BasicInfoComponent,
    GuaranteesComponent,
    CreditsComponent,
    DocumentsComponent,
    ReviewComponent,
  ],
  template: `
    <div class="container py-3">
      <nav class="nav nav-tabs border-bottom mb-3">
        @for (step of steps; track step.key) {
        <a
          class="nav-link"
          [class.active]="activeKey() === step.key"
          [class.disabled]="step.disabled"
          href="javascript:void(0)"
          (click)="onSelect(step.key)"
        >
          {{ step.title }}
        </a>
        }
      </nav>

      <div class="mt-2">
        @switch (activeKey()) { @case ('basic') { <app-basic-info /> } @case
        ('guarantees') { <app-guarantees /> } @case ('credits') {
        <app-credits /> } @case ('documents') { <app-documents /> } @case
        ('review') { <app-review /> } }
      </div>

      <div class="d-flex justify-content-between align-items-center mt-4">
        <button class="btn btn-link" type="button" (click)="cancel.emit()">
          Cancelar
        </button>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            type="button"
            (click)="onBack()"
          >
            Voltar
          </button>
          <button class="btn btn-primary" type="button" (click)="onNext()">
            Continuar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FormStepsComponent {
  @Input() steps: FormStep[] = [
    {
      key: 'basic',
      title: 'Informações básicas',
      description: 'Dados de identificação do trade.',
    },
    {
      key: 'guarantees',
      title: 'Garantias',
      description: 'Detalhes de garantias.',
    },
    { key: 'credits', title: 'Créditos', description: 'Condições e valores.' },
    {
      key: 'documents',
      title: 'Documentos',
      description: 'Envio e validação de documentos.',
    },
    {
      key: 'review',
      title: 'Revisão',
      description: 'Conferência final antes de enviar.',
    },
  ];

  @Input() set activeKeyInput(value: string | undefined) {
    if (value) this.activeKey.set(value);
  }

  @Output() stepChange = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @Output() back = new EventEmitter<string>();
  @Output() next = new EventEmitter<string>();

  protected activeKey = signal<string>(this.steps[0].key);

  protected activeStep(): FormStep | undefined {
    return this.steps.find((s) => s.key === this.activeKey());
  }

  onSelect(key: string) {
    const target = this.steps.find((s) => s.key === key);
    if (!target || target.disabled) return;
    this.activeKey.set(key);
    this.stepChange.emit(key);
  }

  onBack() {
    const idx = this.steps.findIndex((s) => s.key === this.activeKey());
    const prev = this.steps
      .slice(0, idx)
      .reverse()
      .find((s) => !s.disabled);
    if (prev) {
      this.activeKey.set(prev.key);
      this.back.emit(prev.key);
    }
  }

  onNext() {
    const idx = this.steps.findIndex((s) => s.key === this.activeKey());
    const next = this.steps.slice(idx + 1).find((s) => !s.disabled);
    if (next) {
      this.activeKey.set(next.key);
      this.next.emit(next.key);
    }
  }
}
