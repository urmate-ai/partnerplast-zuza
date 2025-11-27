export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
  provider: 'google';
}

export interface GoogleAuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

