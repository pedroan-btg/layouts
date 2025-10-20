import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasicInfoComponent } from './contents/basic-info/basic-info.component';
import { CollateralComponent } from './contents/collateral/collateral.component';
import { CreditsComponent } from './contents/credits/credits.component';
import { DocumentsComponent } from './contents/documents/documents.component';
import { ReviewComponent } from './contents/review/review.component';

export interface FormStep {
  key: string;
  title: string;
  description: string;
  disabled?: boolean;
}

@Component({
  selector: '[fts-form-steps]',
  standalone: true,
  imports: [
    CommonModule,
    BasicInfoComponent,
    CollateralComponent,
    CreditsComponent,
    DocumentsComponent,
    ReviewComponent,
  ],
  templateUrl: './form-steps.component.html',
})
export class FormStepsComponent {
  @Input() steps: FormStep[] = [
    {
      key: 'basic',
      title: 'Informações básicas',
      description: 'Dados de identificação do trade.',
    },
    {
      key: 'collateral',
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
  @Output() cancelAction = new EventEmitter<void>();
  @Output() back = new EventEmitter<string>();
  @Output() next = new EventEmitter<string>();

  protected activeKey = signal<string>(this.steps[0].key);

  protected activeStep(): FormStep | undefined {
    return this.steps.find((s) => s.key === this.activeKey());
  }

  onSelect(key: string): void {
    const target = this.steps.find((s) => s.key === key);

    if (!target || target.disabled) return;

    this.activeKey.set(key);
    this.stepChange.emit(key);
  }

  onBack(): void {
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

  onNext(): void {
    const idx = this.steps.findIndex((s) => s.key === this.activeKey());
    const next = this.steps.slice(idx + 1).find((s) => !s.disabled);

    if (next) {
      this.activeKey.set(next.key);
      this.next.emit(next.key);
    }
  }
}
