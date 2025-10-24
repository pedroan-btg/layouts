import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CollateralService } from './collateral.service';
import { Collateral, CollateralPayload } from './models';
import { firstValueFrom } from 'rxjs';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

describe('CollateralService', () => {
  let service: CollateralService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CollateralService],
    });
    service = TestBed.inject(CollateralService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial collaterals as empty array', () => {
    service.collaterals$.subscribe(collaterals => {
      expect(collaterals).toEqual([]);
    });
  });

  it('should have initial page as 1 and pageSize as 12', () => {
    service.page$.subscribe(page => {
      expect(page).toBe(1);
    });
    service.pageSize$.subscribe(pageSize => {
      expect(pageSize).toBe(12);
    });
  });

  it('should have initial loading as false', () => {
    service.loading$.subscribe(loading => {
      expect(loading).toBe(false);
    });
  });

  it('should have initial total as 0', () => {
    service.total$.subscribe(total => {
      expect(total).toBe(0);
    });
  });

  describe('addCollateral', () => {
    it('should add collateral with generated id and default status', async () => {
      const payload: CollateralPayload = {
        type: 'ACAO',
        tickerOrName: 'PETR4',
        guarantor: 'BTG',
        account: '12345',
        linked: true,
        unitPrice: 25.5,
        allocatedQuantity: 100,
        value: 2550,
        lendingValue: 2400,
        issuer: 'Petrobras',
        isinCode: 'BRPETRACNPR6',
        assetCode: 'PETR4',
      };

      service.addCollateral(payload);

      const collaterals = await firstValueFrom(service.collaterals$);

      expect(collaterals).toHaveLength(1);
      expect(collaterals[0].id).toBe('test-uuid-123');
      expect(collaterals[0].status).toBe('Complete data');
      expect(collaterals[0].type).toBe('ACAO');
      expect(collaterals[0].value).toBe(2550);
    });

    it('should add collateral with custom status when provided', async () => {
      const payload: CollateralPayload = {
        type: 'CDB',
        tickerOrName: 'CDB BTG',
        guarantor: 'BTG',
        account: '54321',
        linked: false,
        unitPrice: 1000,
        allocatedQuantity: 5,
        value: 5000,
        lendingValue: 4800,
        issuer: 'BTG Pactual',
        isinCode: 'BRCDBBTGCNPR',
        assetCode: 'CDB001',
        status: 'Pending validation',
      };

      service.addCollateral(payload);

      const collaterals = await firstValueFrom(service.collaterals$);

      expect(collaterals).toHaveLength(1);
      expect(collaterals[0].status).toBe('Pending validation');
    });

    it('should calculate total correctly after adding collaterals', async () => {
      const payload1: CollateralPayload = {
        type: 'ACAO',
        tickerOrName: 'PETR4',
        guarantor: 'BTG',
        account: '12345',
        linked: true,
        unitPrice: 25.5,
        allocatedQuantity: 100,
        value: 2550,
        lendingValue: 2400,
        issuer: 'Petrobras',
        isinCode: 'BRPETRACNPR6',
        assetCode: 'PETR4',
      };

      const payload2: CollateralPayload = {
        type: 'CDB',
        tickerOrName: 'CDB BTG',
        guarantor: 'BTG',
        account: '54321',
        linked: false,
        unitPrice: 1000,
        allocatedQuantity: 3,
        value: 3000,
        lendingValue: 2900,
        issuer: 'BTG Pactual',
        isinCode: 'BRCDBBTGCNPR',
        assetCode: 'CDB001',
      };

      service.addCollateral(payload1);
      service.addCollateral(payload2);

      const total = await firstValueFrom(service.total$);

      expect(total).toBe(5550); // 2550 + 3000
    });
  });

  describe('removeCollateral', () => {
    it('should remove collateral by id', async () => {
      // First add a collateral
      const payload: CollateralPayload = {
        type: 'ACAO',
        tickerOrName: 'PETR4',
        guarantor: 'BTG',
        account: '12345',
        linked: true,
        unitPrice: 25.5,
        allocatedQuantity: 100,
        value: 2550,
        lendingValue: 2400,
        issuer: 'Petrobras',
        isinCode: 'BRPETRACNPR6',
        assetCode: 'PETR4',
      };

      service.addCollateral(payload);

      let collaterals = await firstValueFrom(service.collaterals$);
      expect(collaterals).toHaveLength(1);

      // Remove it
      service.removeCollateral('test-uuid-123');

      collaterals = await firstValueFrom(service.collaterals$);
      expect(collaterals).toHaveLength(0);
    });

    it('should not affect other collaterals when removing specific id', async () => {
      // Mock different UUIDs for each call
      const mockUUID = vi.fn().mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');
      global.crypto.randomUUID = mockUUID;

      const payload1: CollateralPayload = {
        type: 'ACAO',
        tickerOrName: 'PETR4',
        guarantor: 'BTG',
        account: '12345',
        linked: true,
        unitPrice: 25.5,
        allocatedQuantity: 100,
        value: 2550,
        lendingValue: 2400,
        issuer: 'Petrobras',
        isinCode: 'BRPETRACNPR6',
        assetCode: 'PETR4',
      };

      const payload2: CollateralPayload = {
        type: 'CDB',
        tickerOrName: 'CDB BTG',
        guarantor: 'BTG',
        account: '54321',
        linked: false,
        unitPrice: 1000,
        allocatedQuantity: 3,
        value: 3000,
        lendingValue: 2900,
        issuer: 'BTG Pactual',
        isinCode: 'BRCDBBTGCNPR',
        assetCode: 'CDB001',
      };

      service.addCollateral(payload1);
      service.addCollateral(payload2);

      let collaterals = await firstValueFrom(service.collaterals$);
      expect(collaterals).toHaveLength(2);

      // Remove only the first one
      service.removeCollateral('uuid-1');

      collaterals = await firstValueFrom(service.collaterals$);
      expect(collaterals).toHaveLength(1);
      expect(collaterals[0].id).toBe('uuid-2');
      expect(collaterals[0].type).toBe('CDB');
    });
  });

  describe('pagination', () => {
    it('should change page', async () => {
      service.changePage(3);

      const page = await firstValueFrom(service.page$);
      expect(page).toBe(3);
    });

    it('should change page size and reset page to 1', async () => {
      // First set page to something other than 1
      service.changePage(5);
      let page = await firstValueFrom(service.page$);
      expect(page).toBe(5);

      // Change page size
      service.changePageSize(24);

      const pageSize = await firstValueFrom(service.pageSize$);
      page = await firstValueFrom(service.page$);

      expect(pageSize).toBe(24);
      expect(page).toBe(1); // Should reset to 1
    });

    it('should return correct paged collaterals', async () => {
      // Add multiple collaterals
      const mockUUID = vi
        .fn()
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')
        .mockReturnValueOnce('uuid-3')
        .mockReturnValueOnce('uuid-4')
        .mockReturnValueOnce('uuid-5');
      global.crypto.randomUUID = mockUUID;

      // Add 5 collaterals
      for (let i = 1; i <= 5; i++) {
        const payload: CollateralPayload = {
          type: 'ACAO',
          tickerOrName: `STOCK${i}`,
          guarantor: 'BTG',
          account: `${i}2345`,
          linked: true,
          unitPrice: 10 * i,
          allocatedQuantity: 10,
          value: 100 * i,
          lendingValue: 90 * i,
          issuer: `Issuer${i}`,
          isinCode: `ISIN${i}`,
          assetCode: `CODE${i}`,
        };
        service.addCollateral(payload);
      }

      // Set page size to 2
      service.changePageSize(2);

      // Get first page
      let pagedCollaterals = await firstValueFrom(service.pagedCollaterals$);
      expect(pagedCollaterals).toHaveLength(2);
      expect(pagedCollaterals[0].tickerOrName).toBe('STOCK1');
      expect(pagedCollaterals[1].tickerOrName).toBe('STOCK2');

      // Go to page 2
      service.changePage(2);
      pagedCollaterals = await firstValueFrom(service.pagedCollaterals$);
      expect(pagedCollaterals).toHaveLength(2);
      expect(pagedCollaterals[0].tickerOrName).toBe('STOCK3');
      expect(pagedCollaterals[1].tickerOrName).toBe('STOCK4');

      // Go to page 3 (should have only 1 item)
      service.changePage(3);
      pagedCollaterals = await firstValueFrom(service.pagedCollaterals$);
      expect(pagedCollaterals).toHaveLength(1);
      expect(pagedCollaterals[0].tickerOrName).toBe('STOCK5');
    });
  });

  describe('loading state', () => {
    it('should start loading', async () => {
      service.startLoading();

      const loading = await firstValueFrom(service.loading$);
      expect(loading).toBe(true);
    });

    it('should stop loading', async () => {
      service.startLoading();
      let loading = await firstValueFrom(service.loading$);
      expect(loading).toBe(true);

      service.stopLoading();
      loading = await firstValueFrom(service.loading$);
      expect(loading).toBe(false);
    });
  });

  describe('importFile', () => {
    it('should start loading when importing file', () => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

      service.importFile(file);

      // Should start loading immediately
      firstValueFrom(service.loading$).then(loading => {
        expect(loading).toBe(true);
      });
    });

    it('should stop loading after timeout', async () => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

      service.importFile(file);

      // Check that loading stops after the timeout (600ms)
      await new Promise<void>(resolve => {
        setTimeout(async () => {
          const loading = await firstValueFrom(service.loading$);
          expect(loading).toBe(false);
          resolve();
        }, 700); // Wait a bit longer than the timeout
      });
    });
  });

  describe('edge cases', () => {
    it('should handle collaterals with zero or undefined values in total calculation', async () => {
      const mockUUID = vi
        .fn()
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')
        .mockReturnValueOnce('uuid-3');
      global.crypto.randomUUID = mockUUID;

      const payload1: CollateralPayload = {
        type: 'ACAO',
        tickerOrName: 'ZERO',
        guarantor: 'BTG',
        account: '12345',
        linked: true,
        unitPrice: 0,
        allocatedQuantity: 0,
        value: 0,
        lendingValue: 0,
        issuer: 'Test',
        isinCode: 'TEST',
        assetCode: 'ZERO',
      };

      const payload2: CollateralPayload = {
        type: 'CDB',
        tickerOrName: 'UNDEFINED',
        guarantor: 'BTG',
        account: '54321',
        linked: false,
        unitPrice: 100,
        allocatedQuantity: 1,
        value: undefined as any, // Test undefined value
        lendingValue: 100,
        issuer: 'Test',
        isinCode: 'TEST',
        assetCode: 'UNDEF',
      };

      const payload3: CollateralPayload = {
        type: 'DEBENTURE',
        tickerOrName: 'NORMAL',
        guarantor: 'BTG',
        account: '99999',
        linked: true,
        unitPrice: 50,
        allocatedQuantity: 2,
        value: 100,
        lendingValue: 95,
        issuer: 'Test',
        isinCode: 'TEST',
        assetCode: 'NORMAL',
      };

      service.addCollateral(payload1);
      service.addCollateral(payload2);
      service.addCollateral(payload3);

      const total = await firstValueFrom(service.total$);

      // Should be 0 + 0 + 100 = 100 (undefined treated as 0)
      expect(total).toBe(100);
    });

    it('should handle removing non-existent id gracefully', async () => {
      const payload: CollateralPayload = {
        type: 'ACAO',
        tickerOrName: 'PETR4',
        guarantor: 'BTG',
        account: '12345',
        linked: true,
        unitPrice: 25.5,
        allocatedQuantity: 100,
        value: 2550,
        lendingValue: 2400,
        issuer: 'Petrobras',
        isinCode: 'BRPETRACNPR6',
        assetCode: 'PETR4',
      };

      service.addCollateral(payload);

      let collaterals = await firstValueFrom(service.collaterals$);
      expect(collaterals).toHaveLength(1);

      // Try to remove non-existent id
      service.removeCollateral('non-existent-id');

      collaterals = await firstValueFrom(service.collaterals$);
      expect(collaterals).toHaveLength(1); // Should remain unchanged
    });
  });
});
