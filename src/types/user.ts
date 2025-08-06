// types/user.ts

export interface UserMetadata {
  // Add your custom metadata fields here
  full_name?: string;
  avatar_url?: string;
  // Add more fields as your app requires
}

export interface AppMetadata {
  provider?: string;
  providers?: string[];
  // Add more fields as needed
}

export interface Identity {
  id: string;
  user_id: string;
  identity_data: {
    email?: string;
    phone?: string;
    // Extend with more as needed
  };
  provider: string;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata: UserMetadata;
  app_metadata: AppMetadata;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  aud: string;
  role?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  identities?: Identity[];
}
