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
  private readonly baseUrl = 'http://sampleapi';

  /**
   * Faz GET em `http://sampleapi/{dealRAS}/getdata`.
   * @param dealRAS Valor do campo Deal RAS (ex.: "123")
   */
  getDealRas(dealRAS: string | number): Observable<DealRasResponse> {
    const id = String(dealRAS).trim();
    const url = `${this.baseUrl}/${encodeURIComponent(id)}/getdata`;
    return this.http.get<DealRasResponse>(url);
  }
}