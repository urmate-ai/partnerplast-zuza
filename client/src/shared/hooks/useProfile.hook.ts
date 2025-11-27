import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateProfile, changePassword, getProfile, type UpdateProfileData, type ChangePasswordData } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
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

