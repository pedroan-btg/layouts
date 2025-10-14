import { Component } from '@angular/core';

@Component({
  selector: 'app-credits',
  standalone: true,
  template: `
    <div class="container">
      <div class="row">
        <div class="col">
          <h6 class="fw-semibold mb-2">Créditos</h6>
          <p class="text-muted small mb-0">Condições e valores (sample).</p>
        </div>
      </div>
    </div>
  `
})
export class CreditsComponent {}