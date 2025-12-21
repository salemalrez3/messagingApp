// Generated services for Chats

import api from "../config/api";
import type {
  GetChatsParams,
  GetChatsResponse,
  CreateChatPayload,
} from "../types/chatTypes";

export async function getChats(params?: GetChatsParams): Promise<GetChatsResponse> {
  const res = await api.get('/chats', { params });
  return res.data;
}

export async function createChat(data: CreateChatPayload): Promise<''> {
  const res = await api.post('/chats', data);
  return res.data;
}