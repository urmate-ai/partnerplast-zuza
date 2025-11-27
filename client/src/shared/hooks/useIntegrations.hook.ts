import { useQuery } from '@tanstack/react-query';
import { getIntegrations } from '../../services/integrations.service';

export const useIntegrations = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['integrations', searchQuery],
    queryFn: () => getIntegrations(searchQuery),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
};


