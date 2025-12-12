// Generated hooks for Messages

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage } from "../../services/msg";
import type {
  GetMessagesParams,
  GetMessagesResponse,
  SendMessageParams,
  SendMessagePayload,
  SendMessageResponse,
} from "../../types/msgTypes";

export const useGetMessages = (params: GetMessagesParams) => {
  return useQuery<GetMessagesResponse, Error>({
    queryKey: ['messages', params.chatId, params.cursor],
    queryFn: () => getMessages(params),
    enabled: !!params.chatId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation<SendMessageResponse, Error, { params: SendMessageParams; data: SendMessagePayload }>({
    mutationFn: ({ params, data }) => sendMessage(params, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.params.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};