import { Component } from '@angular/core';
import { vitest } from 'vitest';

vitest.mock('fts-frontui/table', () => ({
  Table: Component({
    selector: 'fts-table',
    standalone: true,
    template: '<div><ng-content></ng-content></div>',
  })(class {}),
  TableColumn: Component({
    selector: 'fts-table-column',
    standalone: true,
    template: '<div><ng-content></ng-content></div>',
  })(class {}),
}));

vitest.mock('fts-frontui/loading', () => ({
  Loading: Component({
    selector: 'fts-loading',
    standalone: true,
    template: '<div></div>',
  })(class {}),
}));

vitest.mock('fts-frontui/i18n', () => ({
  i18n: Component({
    selector: 'fts-i18n',
    standalone: true,
    template: '<div><ng-content></ng-content></div>',
  })(class {}),
}));

// Stub dos serviços para evitar carregar implementação real nas execuções isoladas
vitest.mock('./basic-info.service', () => ({
  BasicInfoService: class {},
}));

vitest.mock('./services/get-deal-ras.service', () => ({
  GetDealRasService: class {},
}));