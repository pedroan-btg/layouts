import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import type { CollateralPayload } from '../models';

@Component({
  selector: '[fts-collateral-add-modal]',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './collateral-add-modal.component.html',
})
export class CollateralAddModalComponent {
  @Input() open = false;
  @Input() collateralTypes: { label: string; value: string }[] = [];
  @Output() save = new EventEmitter<CollateralPayload>();
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    type: [null as unknown, [Validators.required]],
    tickerOrName: ['', [Validators.required]],
    guarantor: [''],
    account: [''],
    linked: [false],
    unitPrice: [null as unknown as number, []],
    allocatedQuantity: [null as unknown as number, []],
    value: [null as unknown as number, [Validators.required]],
    lendingValue: [null as unknown as number, []],
    issuer: [''],
    isinCode: [''],
    assetCode: [''],
  });

  onClose(): void {
    this.form.reset({ linked: false });
    this.closed.emit();
  }

  onSave(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: CollateralPayload = {
      type: String(v.type ?? ''),
      tickerOrName: v.tickerOrName ?? '',
      guarantor: v.guarantor ?? '',
      account: v.account ?? '',
      linked: !!v.linked,
      unitPrice: Number(v.unitPrice ?? 0),
      allocatedQuantity: Number(v.allocatedQuantity ?? 0),
      value: Number(v.value ?? 0),
      lendingValue: Number(v.lendingValue ?? 0),
      issuer: v.issuer ?? '',
      isinCode: v.isinCode ?? '',
      assetCode: v.assetCode ?? '',
    };
    this.save.emit(payload);
    this.form.reset({ linked: false });
  }
}
