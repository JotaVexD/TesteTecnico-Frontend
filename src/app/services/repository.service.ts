import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repository } from '../models/repository';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private apiUrl = '/api/Repositories';

  constructor(private http: HttpClient) {}

  searchRepositories(query: string): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/Search?query=${query}&page=1&perPage=100`);
  }

  toggleFavorite(repositoryId: number): Observable<Repository> {
    const body = { repositoryId }; // ← corpo com repositoryId
    return this.http.post<Repository>(`${this.apiUrl}/ToggleFavorite`, body);
  }

  getRelevant(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/Relevant`);
  }
}