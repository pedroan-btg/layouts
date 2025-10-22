import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GetDealRasService } from './get-deal-ras.service';
import { DealRas, DealRasResponse } from '../models';

describe('GetDealRasService', () => {
  let service: GetDealRasService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://webapp-ras-uat/API/CreditRisk/RAS/RAS-API/External/core/workflow/deals/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GetDealRasService]
    });
    service = TestBed.inject(GetDealRasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDealRas', () => {
    it('should make GET request with correct URL for string dealRAS', () => {
      const dealRAS = '48230';
      const mockResponse: DealRas = {
        DealStatus: { Description: 'Active' },
        NewContract: 'NC001',
        BaseContract: 'BC001',
        Account: 'ACC001',
        ProductCanonical: 'Product1',
        UseOfProceedsCanonical: 'Use1',
        Book: 'Book1',
        DisbursementDate: '2024-01-15T00:00:00Z',
        MaturityDate: '2024-12-15T00:00:00Z'
      } as DealRas;

      service.getDealRas(dealRAS).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/${encodeURIComponent(dealRAS)}?username=ras_system`;
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should make GET request with correct URL for number dealRAS', () => {
      const dealRAS = 48230;
      const mockResponse: DealRas = {
        DealStatus: { Description: 'Active' },
        NewContract: 'NC001'
      } as DealRas;

      service.getDealRas(dealRAS).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/${encodeURIComponent(String(dealRAS))}?username=ras_system`;
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should trim whitespace from string dealRAS', () => {
      const dealRAS = '  48230  ';
      const mockResponse: DealRas = {
        DealStatus: { Description: 'Active' }
      } as DealRas;

      service.getDealRas(dealRAS).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map DealRas response to DealRasResponse with status from DealStatus.Description', () => {
      const dealRAS = '48230';
      const mockResponse: DealRas = {
        DealStatus: { Description: 'Active Deal' },
        NewContract: 'NC001',
        BaseContract: 'BC001',
        Account: 'ACC001',
        ProductCanonical: 'Product1',
        UseOfProceedsCanonical: 'Use1',
        Book: 'Book1',
        DisbursementDate: '2024-01-15T00:00:00Z',
        MaturityDate: '2024-12-15T00:00:00Z'
      } as DealRas;

      const expectedResponse: DealRasResponse = {
        ...mockResponse,
        status: 'Active Deal'
      };

      service.getDealRas(dealRAS).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        expect(response.status).toBe('Active Deal');
      });

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      req.flush(mockResponse);
    });

    it('should use "OK" as default status when DealStatus.Description is null', () => {
      const dealRAS = '48230';
      const mockResponse: DealRas = {
        DealStatus: { Description: null },
        NewContract: 'NC001'
      } as DealRas;

      service.getDealRas(dealRAS).subscribe((response) => {
        expect(response.status).toBe('OK');
      });

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      req.flush(mockResponse);
    });

    it('should use "OK" as default status when DealStatus.Description is undefined', () => {
      const dealRAS = '48230';
      const mockResponse: DealRas = {
        DealStatus: { Description: undefined },
        NewContract: 'NC001'
      } as DealRas;

      service.getDealRas(dealRAS).subscribe((response) => {
        expect(response.status).toBe('OK');
      });

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      req.flush(mockResponse);
    });

    it('should use "OK" as default status when DealStatus is null', () => {
      const dealRAS = '48230';
      const mockResponse: DealRas = {
        DealStatus: null,
        NewContract: 'NC001'
      } as DealRas;

      service.getDealRas(dealRAS).subscribe((response) => {
        expect(response.status).toBe('OK');
      });

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      req.flush(mockResponse);
    });

    it('should use "OK" as default status when DealStatus is undefined', () => {
      const dealRAS = '48230';
      const mockResponse: DealRas = {
        DealStatus: undefined,
        NewContract: 'NC001'
      } as DealRas;

      service.getDealRas(dealRAS).subscribe((response) => {
        expect(response.status).toBe('OK');
      });

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      req.flush(mockResponse);
    });

    it('should handle special characters in dealRAS by encoding them', () => {
      const dealRAS = 'ABC@123#456';
      const mockResponse: DealRas = {
        DealStatus: { Description: 'Active' }
      } as DealRas;

      service.getDealRas(dealRAS).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/${encodeURIComponent(dealRAS)}?username=ras_system`;
      });

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should preserve all original DealRas properties in the response', () => {
      const dealRAS = '48230';
      const mockResponse: DealRas = {
        DealStatus: { Description: 'Active' },
        NewContract: 'NC001',
        BaseContract: 'BC001',
        Account: 'ACC001',
        ProductCanonical: 'Product1',
        UseOfProceedsCanonical: 'Use1',
        Book: 'Book1',
        DisbursementDate: '2024-01-15T00:00:00Z',
        MaturityDate: '2024-12-15T00:00:00Z',
        Strategy: 'Strategy1',
        PaymentDay: 15
      } as DealRas;

      service.getDealRas(dealRAS).subscribe((response) => {
        expect(response.NewContract).toBe('NC001');
        expect(response.BaseContract).toBe('BC001');
        expect(response.Account).toBe('ACC001');
        expect(response.ProductCanonical).toBe('Product1');
        expect(response.UseOfProceedsCanonical).toBe('Use1');
        expect(response.Book).toBe('Book1');
        expect(response.DisbursementDate).toBe('2024-01-15T00:00:00Z');
        expect(response.MaturityDate).toBe('2024-12-15T00:00:00Z');
        expect(response.Strategy).toBe('Strategy1');
        expect(response.PaymentDay).toBe(15);
        expect(response.status).toBe('Active');
      });

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      req.flush(mockResponse);
    });

    it('should handle HTTP error responses', () => {
      const dealRAS = '48230';
      const errorMessage = 'Deal not found';

      service.getDealRas(dealRAS).subscribe({
        next: () => fail('Expected an error, not a successful response'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne((request) => {
        return request.method === 'GET' &&
               request.url === `${baseUrl}/48230?username=ras_system`;
      });

      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });
  });
});