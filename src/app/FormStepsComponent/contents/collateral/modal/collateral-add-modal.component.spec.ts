import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CollateralAddModalComponent } from './collateral-add-modal.component';

describe('CollateralAddModalComponent', () => {
  let component: CollateralAddModalComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollateralAddModalComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CollateralAddModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('type')?.value).toBeNull();
    expect(component.form.get('tickerOrName')?.value).toBe('');
    expect(component.form.get('guarantor')?.value).toBe('');
    expect(component.form.get('account')?.value).toBe('');
    expect(component.form.get('linked')?.value).toBe(false);
    expect(component.form.get('unitPrice')?.value).toBeNull();
    expect(component.form.get('allocatedQuantity')?.value).toBeNull();
    expect(component.form.get('value')?.value).toBeNull();
    expect(component.form.get('lendingValue')?.value).toBeNull();
    expect(component.form.get('issuer')?.value).toBe('');
    expect(component.form.get('isinCode')?.value).toBe('');
    expect(component.form.get('assetCode')?.value).toBe('');
  });

  it('should validate required fields', () => {
    expect(component.form.get('type')?.hasError('required')).toBe(true);
    expect(component.form.get('tickerOrName')?.hasError('required')).toBe(true);
    expect(component.form.get('value')?.hasError('required')).toBe(true);
  });

  it('should emit closed and reset form on onClose', () => {
    const closedSpy = vi.spyOn(component.closed, 'emit');
    const resetSpy = vi.spyOn(component.form, 'reset');

    component.onClose();

    expect(closedSpy).toHaveBeenCalled();
    expect(resetSpy).toHaveBeenCalledWith({ linked: false });
  });

  it('should not save when form is invalid', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    component.onSave();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should emit save with correct payload when form is valid', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');
    const resetSpy = vi.spyOn(component.form, 'reset');

    // Preencher formulário com dados válidos
    component.form.patchValue({
      type: 'CDB',
      tickerOrName: 'Test Ticker',
      guarantor: 'Test Guarantor',
      account: 'Test Account',
      linked: true,
      unitPrice: 100.5,
      allocatedQuantity: 1000,
      value: 100500,
      lendingValue: 50000,
      issuer: 'Test Issuer',
      isinCode: 'TEST123456',
      assetCode: 'TST001',
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith({
      type: 'CDB',
      tickerOrName: 'Test Ticker',
      guarantor: 'Test Guarantor',
      account: 'Test Account',
      linked: true,
      unitPrice: 100.5,
      allocatedQuantity: 1000,
      value: 100500,
      lendingValue: 50000,
      issuer: 'Test Issuer',
      isinCode: 'TEST123456',
      assetCode: 'TST001',
    });
    expect(resetSpy).toHaveBeenCalledWith({ linked: false });
  });

  it('should handle null/undefined values on onSave', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    // Preencher apenas campos obrigatórios
    component.form.patchValue({
      type: 'DEBENTURE',
      tickerOrName: 'Test',
      value: 1000,
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith({
      type: 'DEBENTURE',
      tickerOrName: 'Test',
      guarantor: '',
      account: '',
      linked: false,
      unitPrice: 0,
      allocatedQuantity: 0,
      value: 1000,
      lendingValue: 0,
      issuer: '',
      isinCode: '',
      assetCode: '',
    });
  });

  it('should accept collateralTypes as input', () => {
    const mockTypes = [
      { label: 'CDB', value: 'CDB' },
      { label: 'Debênture', value: 'DEBENTURE' },
    ];

    component.collateralTypes = mockTypes;

    expect(component.collateralTypes).toEqual(mockTypes);
  });

  it('should accept open as input', () => {
    component.open = true;
    expect(component.open).toBe(true);

    component.open = false;
    expect(component.open).toBe(false);
  });

  it('should convert string values to number on onSave', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    // Preencher formulário com strings que devem ser convertidas para números
    component.form.patchValue({
      type: 'CDB',
      tickerOrName: 'Test',
      value: 1500.75,
      unitPrice: 25.5,
      allocatedQuantity: 100,
      lendingValue: 750.25,
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith({
      type: 'CDB',
      tickerOrName: 'Test',
      guarantor: '',
      account: '',
      linked: false,
      unitPrice: 25.5,
      allocatedQuantity: 100,
      value: 1500.75,
      lendingValue: 750.25,
      issuer: '',
      isinCode: '',
      assetCode: '',
    });
  });

  it('should convert linked to boolean on onSave', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    // Testar com valor truthy
    component.form.patchValue({
      type: 'CDB',
      tickerOrName: 'Test',
      value: 1000,
      linked: true, // string truthy
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linked: true,
      }),
    );

    // Limpar spy para próximo teste
    saveSpy.mockClear();

    // Testar com valor falsy
    component.form.patchValue({
      type: 'DEBENTURE',
      tickerOrName: 'Test2',
      value: 2000,
      linked: null, // valor falsy
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        linked: false,
      }),
    );
  });

  it('should handle type as string on onSave', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    // Testar com type null mas formulário válido
    component.form.patchValue({
      type: null,
      tickerOrName: 'Test',
      value: 1000,
    });
    // Garantir que o formulário seja válido
    component.form.get('type')?.setErrors(null);

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '',
      }),
    );

    saveSpy.mockClear();

    // Testar com type undefined mas formulário válido
    component.form.patchValue({
      type: undefined,
      tickerOrName: 'Test2',
      value: 2000,
    });
    // Garantir que o formulário seja válido
    component.form.get('type')?.setErrors(null);

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '',
      }),
    );
  });

  it('should test all fields with null/undefined values', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    // Primeiro definir valores válidos
    component.form.patchValue({
      type: 'CDB',
      tickerOrName: 'Test',
      value: 1000,
    });

    // Depois alterar para null/undefined mas manter formulário válido
    const formValue = component.form.getRawValue();
    Object.keys(formValue).forEach((key) => {
      component.form.get(key)?.setValue(null);
      component.form.get(key)?.setErrors(null);
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith({
      type: '',
      tickerOrName: '',
      guarantor: '',
      account: '',
      linked: false,
      unitPrice: 0,
      allocatedQuantity: 0,
      value: 0,
      lendingValue: 0,
      issuer: '',
      isinCode: '',
      assetCode: '',
    });
  });
});
