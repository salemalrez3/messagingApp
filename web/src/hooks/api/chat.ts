import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChats, createChat } from "../../services/chat";
import type {
  GetChatsParams,
  GetChatsResponse,
  CreateChatPayload,
} from "../../types/chatTypes";

export const useGetChats = (params?: GetChatsParams) => {
  return useQuery<GetChatsResponse, Error>({
    queryKey: ['chats', params],
    queryFn: () => getChats(params),
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation<'', Error, CreateChatPayload>({
    mutationFn: createChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};