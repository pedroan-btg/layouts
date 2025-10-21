import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Garantia } from '../collateral.service';

export type GarantiaPayload = Omit<Garantia, 'id' | 'status'> & {
  status?: string;
};

@Component({
  selector: '[fts-collateral-add-modal]',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './collateral-add-modal.component.html',
})
export class CollateralAddModalComponent {
  @Input() open = false;
  @Input() tiposGarantia: { label: string; value: string }[] = [];
  @Output() save = new EventEmitter<GarantiaPayload>();
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    tipo: [null as unknown, [Validators.required]],
    tickerOuNome: ['', [Validators.required]],
    garantidor: [''],
    conta: [''],
    vinculado: [false],
    pu: [null as unknown as number, []],
    qtdAlocada: [null as unknown as number, []],
    valor: [null as unknown as number, [Validators.required]],
    lendingValue: [null as unknown as number, []],
    emissor: [''],
    codIsin: [''],
    codAtivo: [''],
  });

  onClose(): void {
    this.form.reset({ vinculado: false });
    this.closed.emit();
  }

  onSave(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: GarantiaPayload = {
      tipo: String(v.tipo ?? ''),
      tickerOuNome: v.tickerOuNome ?? '',
      garantidor: v.garantidor ?? '',
      conta: v.conta ?? '',
      vinculado: !!v.vinculado,
      pu: Number(v.pu ?? 0),
      qtdAlocada: Number(v.qtdAlocada ?? 0),
      valor: Number(v.valor ?? 0),
      lendingValue: Number(v.lendingValue ?? 0),
      emissor: v.emissor ?? '',
      codIsin: v.codIsin ?? '',
      codAtivo: v.codAtivo ?? '',
    };
    this.save.emit(payload);
    this.form.reset({ vinculado: false });
  }
}
