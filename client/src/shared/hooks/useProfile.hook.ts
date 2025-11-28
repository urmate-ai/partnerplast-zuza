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
    mutationFn: async (data: UpdateNotificationsData) => {
      const result = await updateNotifications(data);
      return result;
    },
    onMutate: async (newData) => {
      
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      const previousProfile = queryClient.getQueryData(['profile']);  

      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) {
          return old;
        }
        const updated = {
          ...old,
          ...newData,
        };
        return updated;
      });

      const currentCache = queryClient.getQueryData(['profile']);

      return { previousProfile };
    },
    onError: (err, newData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }
    },
    onSuccess: (updatedProfile, variables) => {
      queryClient.setQueryData(['profile'], updatedProfile);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
