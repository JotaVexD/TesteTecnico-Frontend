// repository.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repository } from '../models/repository';

// Interface local (não precisa de arquivo separado)
interface SearchResult {
  totalCount: number;
  items: Repository[];
}

@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private apiUrl = '/api/Repositories';

  constructor(private http: HttpClient) {}

  searchRepositories(query: string, page: number = 1, perPage: number = 10): Observable<SearchResult> {
    return this.http.get<SearchResult>(
      `${this.apiUrl}/Search?query=${encodeURIComponent(query)}&page=${page}&perPage=${perPage}`
    );
  }
  toggleFavorite(repositoryId: number): Observable<Repository> {
    const body = { repositoryId };
    return this.http.post<Repository>(`${this.apiUrl}/ToggleFavorite`, body);
  }

  getRelevant(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/Relevant`);
  }
}