import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Table, TableColumn } from 'fts-frontui/table';
import { Loading } from 'fts-frontui/loading';
import { CollateralService, Garantia } from './collateral.service';
import { CollateralAddModalComponent, GarantiaPayload } from './modal/collateral-add-modal.component';

@Component({
  selector: '[fts-collateral]',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Table,
    TableColumn,
    Loading,
    CollateralAddModalComponent,
  ],
  providers: [CollateralService],
  templateUrl: './collateral.component.html',
  styleUrls: ['collateral.component.css'],
})
export class CollateralComponent {
  private readonly svc = inject(CollateralService);

  protected readonly garantias$ = this.svc.pagedGarantias$;
  protected readonly total$ = this.svc.total$;
  protected readonly page$ = this.svc.page$;
  protected readonly pageSize$ = this.svc.pageSize$;
  protected readonly loading$ = this.svc.loading$;

  protected showAddModal = false;
  protected openedMenuId: string | null = null;

  @ViewChild('fileInput', { static: false })
  private fileInput?: ElementRef<HTMLInputElement>;

  protected readonly tiposGarantia = [
    { label: 'Alienação Fiduciária', value: 'ALIENACAO' },
    { label: 'CDB', value: 'CDB' },
    { label: 'Debênture', value: 'DEBENTURE' },
  ];

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onModalSave(payload: GarantiaPayload): void {
    this.svc.addGarantia(payload);
    this.closeAddModal();
  }

  onDelete(row: Garantia): void {
    this.svc.removeGarantia(row.id);
  }

  onChangePage(page: number | string): void {
    const n = Number(page);
    this.svc.changePage(n);
  }

  onChangePageSize(size: number): void {
    this.svc.changePageSize(Number(size));
  }

  onImport(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.svc.importarArquivo(file);
    // opcionalmente poderíamos fazer um parse simples aqui
    input.value = '';
  }

  toggleMenu(row: Garantia): void {
    this.openedMenuId = this.openedMenuId === row.id ? null : row.id;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: Event): void {
    const el = ev.target as HTMLElement;
    if (!el.closest('.fts-row-menu')) {
      this.openedMenuId = null;
    }
  }
}