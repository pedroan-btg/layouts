import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DealRasResponse {
  status?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class GetDealRasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://webapp-ras-uat/API/CreditRisk/RAS/RAS-API/External/core/workflow/deals/';

  /**
   * Faz GET em `http://webapp-ras-uat/API/CreditRisk/RAS/RAS-API/External/core/workflow/deals/48230?username=ras_system`.
   * @param dealRAS Valor do campo Deal RAS (ex.: "48230")
   */
  getDealRas(dealRAS: string | number): Observable<DealRasResponse> {
    const id = String(dealRAS).trim();
    const url = `${this.baseUrl}/${encodeURIComponent(id)}?username=ras_system`;
    return this.http.get<DealRasResponse>(url);
  }
}