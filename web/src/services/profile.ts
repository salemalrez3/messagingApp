// Generated services for Profile

import api from "../config/api";
import type {
  UpdateProfilePayload,
  UpdateProfileResponse,
} from "../types/profileTypes";

export async function updateProfile(data: UpdateProfilePayload): Promise<UpdateProfileResponse> {
  const res = await api.put('/api/profile', data);
  return res.data;
}