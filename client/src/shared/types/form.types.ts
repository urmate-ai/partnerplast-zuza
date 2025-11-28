export type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type EditProfileFormData = {
  name: string;
  email: string;
};

export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

