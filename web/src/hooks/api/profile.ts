// Generated hooks for Profile

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../../services/profile";
import type {
  UpdateProfilePayload,
  UpdateProfileResponse,
} from "../../types/profileTypes";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UpdateProfileResponse, Error, UpdateProfilePayload>({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};