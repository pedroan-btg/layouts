import { Component } from '@angular/core';

@Component({
  selector: 'app-documents',
  standalone: true,
  template: `
    <div class="container">
      <div class="row">
        <div class="col">
          <h6 class="fw-semibold mb-2">Documentos</h6>
          <p class="text-muted small mb-0">Envio e validação de documentos (sample).</p>
        </div>
      </div>
    </div>
  `
})
export class DocumentsComponent {}