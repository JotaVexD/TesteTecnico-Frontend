import { Component, ChangeDetectorRef } from '@angular/core';
import { RepositoryService } from './services/repository.service';
import { Repository } from './models/repository';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {
  searchQuery = '';
  repositories: Repository[] = [];
  favorites: Repository[] = [];
  allRelevantRepositories: Repository[] = []; // Lista consolidada de todos os repositórios
  viewMode: 'search' | 'favorites' | 'relevant' = 'search';
  
  // Paginação para busca
  searchCurrentPage = 1;
  searchItemsPerPage = 10;
  
  // Paginação para favoritos
  favoritesCurrentPage = 1;
  favoritesItemsPerPage = 10;
  
  // Paginação para relevantes
  relevantCurrentPage = 1;
  relevantItemsPerPage = 10;
  
  loading = false;
  message = '';

  constructor(
    private repoService: RepositoryService,
    private cdr: ChangeDetectorRef
  ) {}

  // Buscar repositórios
  onSearch() {
    if (!this.searchQuery.trim()) return;
    
    this.loading = true;
    this.viewMode = 'search';
    this.searchCurrentPage = 1;
    
    this.repoService.searchRepositories(this.searchQuery).subscribe({
      next: (data) => {
        this.repositories = data;
        // Adiciona os novos repositórios à lista consolidada
        this.addToAllRelevantRepositories(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = 'Erro: ' + err.message;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Adiciona repositórios à lista consolidada (evita duplicados)
  private addToAllRelevantRepositories(newRepos: Repository[]) {
    newRepos.forEach(newRepo => {
      const existingIndex = this.allRelevantRepositories.findIndex(r => r.id === newRepo.id);
      if (existingIndex === -1) {
        this.allRelevantRepositories.push({...newRepo});
      } else {
        // Mantém o estado de favorito se já existir
        const isFavorite = this.allRelevantRepositories[existingIndex].isFavorite;
        this.allRelevantRepositories[existingIndex] = {...newRepo, isFavorite};
      }
    });
    
    // Ordena por relevância
    this.allRelevantRepositories.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Toggle favorito - ATUALIZADO
  toggleFavorite(repo: Repository) {
    this.repoService.toggleFavorite(repo.id).subscribe({
      next: (updatedRepo) => {
        this.message = updatedRepo.isFavorite 
          ? 'Adicionado aos favoritos!' 
          : 'Removido dos favoritos!';
        
        // Atualiza em todas as listas
        this.updateRepoInAllLists(updatedRepo);
        
        // Atualiza a lista de favoritos imediatamente
        this.updateFavoritesList(updatedRepo);
        
        setTimeout(() => {
          this.message = '';
          this.cdr.detectChanges();
        }, 2000);
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = 'Erro: ' + err.message;
        this.cdr.detectChanges();
      }
    });
  }

  // Atualiza o repositório em todas as listas
  private updateRepoInAllLists(updatedRepo: Repository) {
    // Na lista de busca
    const searchIndex = this.repositories.findIndex(r => r.id === updatedRepo.id);
    if (searchIndex !== -1) {
      this.repositories[searchIndex] = {...updatedRepo};
    }
    
    // Na lista consolidada
    const relevantIndex = this.allRelevantRepositories.findIndex(r => r.id === updatedRepo.id);
    if (relevantIndex !== -1) {
      this.allRelevantRepositories[relevantIndex] = {...updatedRepo};
    } else {
      this.allRelevantRepositories.push({...updatedRepo});
      this.allRelevantRepositories.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  // Atualiza a lista de favoritos imediatamente
  private updateFavoritesList(updatedRepo: Repository) {
    if (updatedRepo.isFavorite) {
      // Adiciona ou atualiza na lista de favoritos
      const existingIndex = this.favorites.findIndex(r => r.id === updatedRepo.id);
      if (existingIndex === -1) {
        this.favorites.push({...updatedRepo});
        this.favorites.sort((a, b) => b.relevanceScore - a.relevanceScore);
      } else {
        this.favorites[existingIndex] = {...updatedRepo};
      }
    } else {
      // Remove da lista de favoritos
      const indexToRemove = this.favorites.findIndex(r => r.id === updatedRepo.id);
      if (indexToRemove !== -1) {
        this.favorites.splice(indexToRemove, 1);
      }
    }
    
    // Resetar página se necessário
    if (this.viewMode === 'favorites' && this.favoritesCurrentPage > this.totalFavoritesPages && this.totalFavoritesPages > 0) {
      this.favoritesCurrentPage = this.totalFavoritesPages;
    }
  }

  // Carrega favoritos - ATUALIZADO (não chama API se já temos os dados)
  loadFavorites() {
    this.loading = true;
    this.viewMode = 'favorites';
    this.favoritesCurrentPage = 1;
    
    // Se já temos dados na lista consolidada, usa eles
    if (this.allRelevantRepositories.length > 0) {
      this.favorites = this.allRelevantRepositories
        .filter(repo => repo.isFavorite)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
      this.loading = false;
      this.cdr.detectChanges();
    } else {
      // Caso contrário, busca da API
      this.repoService.getRelevant().subscribe({
        next: (data) => {
          this.allRelevantRepositories = data.sort((a, b) => b.relevanceScore - a.relevanceScore);
          this.favorites = data
            .filter(repo => repo.isFavorite)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.message = 'Erro: ' + err.message;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Carrega repositórios relevantes - ATUALIZADO
  loadRelevant() {
    this.loading = true;
    this.viewMode = 'relevant';
    this.relevantCurrentPage = 1;
    
    // Se já temos dados na lista consolidada, usa eles
    if (this.allRelevantRepositories.length > 0) {
      this.loading = false;
      this.cdr.detectChanges();
    } else {
      // Caso contrário, busca da API
      this.repoService.getRelevant().subscribe({
        next: (data) => {
          this.allRelevantRepositories = data.sort((a, b) => b.relevanceScore - a.relevanceScore);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.message = 'Erro: ' + err.message;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Método para voltar à busca
  backToSearch() {
    this.viewMode = 'search';
  }

  // Getters para paginação da busca
  get displayedSearchRepositories() {
    const start = (this.searchCurrentPage - 1) * this.searchItemsPerPage;
    const end = start + this.searchItemsPerPage;
    return this.repositories.slice(start, end);
  }

  get totalSearchPages() {
    return Math.ceil(this.repositories.length / this.searchItemsPerPage);
  }

  get hasNextSearchPage() {
    return this.searchCurrentPage < this.totalSearchPages;
  }

  // Getters para paginação de favoritos
  get displayedFavorites() {
    const start = (this.favoritesCurrentPage - 1) * this.favoritesItemsPerPage;
    const end = start + this.favoritesItemsPerPage;
    return this.favorites.slice(start, end);
  }

  get totalFavoritesPages() {
    return Math.ceil(this.favorites.length / this.favoritesItemsPerPage);
  }

  get hasNextFavoritesPage() {
    return this.favoritesCurrentPage < this.totalFavoritesPages;
  }

  // Getters para paginação de relevantes
  get displayedRelevantRepositories() {
    const start = (this.relevantCurrentPage - 1) * this.relevantItemsPerPage;
    const end = start + this.relevantItemsPerPage;
    return this.allRelevantRepositories.slice(start, end);
  }

  get totalRelevantPages() {
    return Math.ceil(this.allRelevantRepositories.length / this.relevantItemsPerPage);
  }

  get hasNextRelevantPage() {
    return this.relevantCurrentPage < this.totalRelevantPages;
  }

  // Métodos de navegação - ATUALIZADOS para todas as abas
  nextPage() {
    if (this.viewMode === 'search' && this.hasNextSearchPage) {
      this.searchCurrentPage++;
    } else if (this.viewMode === 'favorites' && this.hasNextFavoritesPage) {
      this.favoritesCurrentPage++;
    } else if (this.viewMode === 'relevant' && this.hasNextRelevantPage) {
      this.relevantCurrentPage++;
    }
  }

  prevPage() {
    if (this.viewMode === 'search' && this.searchCurrentPage > 1) {
      this.searchCurrentPage--;
    } else if (this.viewMode === 'favorites' && this.favoritesCurrentPage > 1) {
      this.favoritesCurrentPage--;
    } else if (this.viewMode === 'relevant' && this.relevantCurrentPage > 1) {
      this.relevantCurrentPage--;
    }
  }
}