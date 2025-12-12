// Generated types for Profile

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  phone?: string;
  profilePic?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: UpdatedUser;
}

export interface UpdatedUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  profilePic: string;
  about: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}