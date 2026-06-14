import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class LeadService {
  private endpoint = '/api/leads';
  constructor(private http: HttpClient) {}

  submitLead(payload: any): Observable<any> {
    return this.http.post(this.endpoint, payload);
  }
}
