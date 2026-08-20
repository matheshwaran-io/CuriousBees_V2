import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export interface ResearcherQuery {
  q?: string;
  role?: string;
  department?: string;
  interest?: string;
  page?: number;
  limit?: number;
}

export function useResearchers(query: ResearcherQuery) {
  const queryParams = new URLSearchParams();
  if (query.q) queryParams.append('q', query.q);
  if (query.role) queryParams.append('role', query.role);
  if (query.department) queryParams.append('department', query.department);
  if (query.interest) queryParams.append('interest', query.interest);
  if (query.page) queryParams.append('page', query.page.toString());
  if (query.limit) queryParams.append('limit', query.limit.toString());

  return useQuery({
    queryKey: ['researchers', query],
    queryFn: async () => {
      return apiGet<any>(`/api/users/researchers?${queryParams.toString()}`);
    }
  });
}

export function useResearcherProfile(id: string) {
  return useQuery({
    queryKey: ['researcher', id],
    queryFn: async () => {
      return apiGet<any>(`/api/users/${id}/profile`);
    },
    enabled: !!id,
  });
}

