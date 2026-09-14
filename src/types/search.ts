import { NavigationRoute } from './index';

export type SearchResultCategory =
  | 'medication'
  | 'diagnosis'
  | 'lab'
  | 'timeline'
  | 'document'
  | 'allergy_inconsistency'
  | 'provider_facility';

export interface InconsistencyDetail {
  firstFact: string;
  secondFact: string;
  firstSource?: string;
  secondSource?: string;
  firstDate?: string;
  secondDate?: string;
  severity?: 'High' | 'Moderate' | 'Advisory' | 'Low' | 'Medium';
}

export interface SearchResultItem {
  id: string;
  category: SearchResultCategory;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  date?: string;
  provider?: string;
  facility?: string;
  status?: string;
  snippet?: string;
  matchedField: string;
  relevanceScore: number;
  targetRoute: NavigationRoute;
  targetId?: string;
  inconsistencyDetails?: InconsistencyDetail;
  metadata?: Record<string, any>;
}

export interface SearchResultsResponse {
  query: string;
  patientId: string;
  totalCount: number;
  countsByCategory: Record<SearchResultCategory, number>;
  results: SearchResultItem[];
  groupedResults: Record<SearchResultCategory, SearchResultItem[]>;
}
