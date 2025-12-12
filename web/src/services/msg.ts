// Generated services for Messages

import api from "../config/api";
import type {
  GetMessagesParams,
  GetMessagesResponse,
  SendMessageParams,
  SendMessagePayload,
  SendMessageResponse,
} from "../types/msgTypes";

export async function getMessages(params: GetMessagesParams): Promise<GetMessagesResponse> {
  const res = await api.get('/msgs', { params });
  return res.data;
}

export async function sendMessage(params: SendMessageParams, data: SendMessagePayload): Promise<SendMessageResponse> {
  const res = await api.post('/msgs', data, { params });
  return res.data;
}