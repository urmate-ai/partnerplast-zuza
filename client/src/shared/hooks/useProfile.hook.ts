import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  updateProfile,
  changePassword,
  getProfile,
  updateNotifications,
  type UpdateProfileData,
  type ChangePasswordData,
  type UpdateNotificationsData,
} from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setAuth, user, token } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      
      if (token && user) {
        setAuth(
          {
            id: updatedProfile.id,
            email: updatedProfile.email,
            name: updatedProfile.name,
          },
          token,
        );
      }
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => changePassword(data),
  });
};

export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationsData) => updateNotifications(data),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(['profile']);

      // Optimistically update to the new value
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...newData,
        };
      });

      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }
    },
    onSuccess: (updatedProfile) => {
      // Update query cache with full updated profile from server
      queryClient.setQueryData(['profile'], updatedProfile);
    },
  });
};

