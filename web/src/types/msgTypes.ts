// Generated types for Messages

import type { User } from "./profileTypes";

export interface GetMessagesParams {
  chatId: string;
  limit?: number;
  cursor: string;
}



export interface SendMessageParams {
  chatId: string;
}



export interface SendMessageResponse {
  // Based on 201 response (no specific schema)
}


export interface MessageReply {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  editedAt: string;
  isDeleted: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  senderId: string;
  chatId: string;
  createdAt: string;
  editedAt: string;
  isDeleted: boolean;
  replyToMessage: MessageReply | null;
}

export interface GetMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

export interface SendMessageParams {
  chatId: string;
}

export interface SendMessagePayload {
  text: string;

}

export interface PostMessageResponse {
  message: Message;
}