import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { RepositoryService } from './services/repository.service';
import { Repository } from './models/repository';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  searchQuery = '';
  repositories: Repository[] = [];
  totalSearchCount = 0;
  favorites: Repository[] = [];
  allRelevantRepositories: Repository[] = [];
  viewMode: 'search' | 'favorites' | 'relevant' = 'search';
  
  searchCurrentPage = 1;
  searchItemsPerPage = 10;
  
  favoritesCurrentPage = 1;
  favoritesItemsPerPage = 10;
  
  relevantCurrentPage = 1;
  relevantItemsPerPage = 10;
  
  loading = false;
  message = '';
  searchError = '';

  constructor(
    private repoService: RepositoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    if (localStorage.getItem('hasData')) {
      this.loadFavorites();
      this.loadRelevant();
    }
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchError = 'Digite um termo para buscar';
      return;
    }
    
    this.searchError = '';
    this.loading = true;
    this.viewMode = 'search';
    this.searchCurrentPage = 1;
    
    this.executeSearch();
  }

  private executeSearch() {
    if (!this.searchQuery.trim()) return;
    
    this.loading = true;
    
    this.repoService.searchRepositories(
      this.searchQuery, 
      this.searchCurrentPage, 
      this.searchItemsPerPage
    ).subscribe({
      next: (result: any) => {
        this.repositories = result.items;
        this.totalSearchCount = result.totalCount;
        
        if (this.searchCurrentPage === 1) {
          this.allRelevantRepositories = [];
        }
        
        this.addToAllRelevantRepositories(result.items);
        localStorage.setItem('hasData', 'true');
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = 'Erro na busca: ' + (err.error?.message || err.message);
        this.repositories = [];
        this.totalSearchCount = 0;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchItemsPerPageChange() {
    if (this.searchQuery.trim() === '') return;
    
    this.searchCurrentPage = 1;
    this.repositories = [];
    this.loading = true;
    this.cdr.detectChanges();
    
    this.executeSearch();
  }

  private addToAllRelevantRepositories(newRepos: Repository[]) {
    newRepos.forEach(newRepo => {
      const existingIndex = this.allRelevantRepositories.findIndex(r => r.id === newRepo.id);
      if (existingIndex === -1) {
        this.allRelevantRepositories.push({...newRepo});
      } else {
        const isFavorite = this.allRelevantRepositories[existingIndex].isFavorite;
        this.allRelevantRepositories[existingIndex] = {...newRepo, isFavorite};
      }
    });
    
    this.allRelevantRepositories.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  toggleFavorite(repo: Repository) {
    this.repoService.toggleFavorite(repo.id).subscribe({
      next: (updatedRepo) => {
        this.message = updatedRepo.isFavorite 
          ? 'Adicionado aos favoritos!' 
          : 'Removido dos favoritos!';
        
        this.updateRepoInAllLists(updatedRepo);
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

  private updateRepoInAllLists(updatedRepo: Repository) {
    const searchIndex = this.repositories.findIndex(r => r.id === updatedRepo.id);
    if (searchIndex !== -1) {
      this.repositories[searchIndex] = {...updatedRepo};
    }
    
    const relevantIndex = this.allRelevantRepositories.findIndex(r => r.id === updatedRepo.id);
    if (relevantIndex !== -1) {
      this.allRelevantRepositories[relevantIndex] = {...updatedRepo};
    } else {
      this.allRelevantRepositories.push({...updatedRepo});
      this.allRelevantRepositories.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  private updateFavoritesList(updatedRepo: Repository) {
    if (updatedRepo.isFavorite) {
      const existingIndex = this.favorites.findIndex(r => r.id === updatedRepo.id);
      if (existingIndex === -1) {
        this.favorites.push({...updatedRepo});
        this.favorites.sort((a, b) => b.relevanceScore - a.relevanceScore);
      } else {
        this.favorites[existingIndex] = {...updatedRepo};
      }
    } else {
      const indexToRemove = this.favorites.findIndex(r => r.id === updatedRepo.id);
      if (indexToRemove !== -1) {
        this.favorites.splice(indexToRemove, 1);
      }
    }
    
    if (this.viewMode === 'favorites' && this.favoritesCurrentPage > this.totalFavoritesPages && this.totalFavoritesPages > 0) {
      this.favoritesCurrentPage = this.totalFavoritesPages;
    }
  }

  loadFavorites() {
    this.loading = true;
    this.viewMode = 'favorites';
    this.favoritesCurrentPage = 1;
    
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
        this.message = 'Erro ao carregar favoritos: ' + err.message;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRelevant() {
    this.loading = true;
    this.viewMode = 'relevant';
    this.relevantCurrentPage = 1;
    
    this.repoService.getRelevant().subscribe({
      next: (data) => {
        this.allRelevantRepositories = data.sort((a, b) => b.relevanceScore - a.relevanceScore);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = 'Erro ao carregar relevantes: ' + err.message;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  backToSearch() {
    this.viewMode = 'search';
  }

  nextSearchPage() {
    this.searchCurrentPage++;
    this.executeSearch();
    window.scrollTo(0, 0);
  }

  prevSearchPage() {
    if (this.searchCurrentPage > 1) {
      this.searchCurrentPage--;
      this.executeSearch();
      window.scrollTo(0, 0);
    }
  }

  onFavoritesItemsPerPageChange() {
    this.favoritesCurrentPage = 1;
    this.cdr.detectChanges();
  }

  onRelevantItemsPerPageChange() {
    this.relevantCurrentPage = 1;
    this.cdr.detectChanges();
  }

  nextFavoritesPage() {
    if (this.favoritesCurrentPage < this.totalFavoritesPages) {
      this.favoritesCurrentPage++;
      window.scrollTo(0, 0);
    }
  }

  prevFavoritesPage() {
    if (this.favoritesCurrentPage > 1) {
      this.favoritesCurrentPage--;
      window.scrollTo(0, 0);
    }
  }

  nextRelevantPage() {
    if (this.relevantCurrentPage < this.totalRelevantPages) {
      this.relevantCurrentPage++;
      window.scrollTo(0, 0);
    }
  }

  prevRelevantPage() {
    if (this.relevantCurrentPage > 1) {
      this.relevantCurrentPage--;
      window.scrollTo(0, 0);
    }
  }

  get totalSearchPages() {
    return Math.ceil(this.totalSearchCount / this.searchItemsPerPage);
  }

  get hasNextSearchPage() {
    return this.searchCurrentPage < this.totalSearchPages;
  }

  get searchResultsInfo() {
    if (this.totalSearchCount === 0) return '';
    
    const start = (this.searchCurrentPage - 1) * this.searchItemsPerPage + 1;
    const end = Math.min(this.searchCurrentPage * this.searchItemsPerPage, this.totalSearchCount);
    
    return `Mostrando ${start}-${end} de ${this.totalSearchCount.toLocaleString()} resultados`;
  }

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

  get displayedRelevantRepositories() {
    const itemsPerPage = Number(this.relevantItemsPerPage);
    const start = (this.relevantCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return this.allRelevantRepositories.slice(start, end);
  }

  get totalRelevantPages() {
    return Math.ceil(this.allRelevantRepositories.length / this.relevantItemsPerPage);
  }

  get hasNextRelevantPage() {
    return this.relevantCurrentPage < this.totalRelevantPages;
  }
}