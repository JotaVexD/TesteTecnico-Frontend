export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  language: string;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  updatedAt: string;
  isFavorite: boolean;
  relevanceScore: number;
}