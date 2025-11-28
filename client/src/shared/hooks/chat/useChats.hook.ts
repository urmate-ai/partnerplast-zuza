import { useQuery } from '@tanstack/react-query';
import { getChats } from '../../../services/chats.service';

export const useChats = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['chats', searchQuery],
    queryFn: () => getChats(searchQuery),
    staleTime: 2 * 60 * 1000, 
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
};


