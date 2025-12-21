// Generated types for Chats

export interface GetChatsParams {
  limit?: number;
}

export interface GetChatsResponse {
  chats: Chat[];
}



// Common Chat Types
export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  groupPic: string;
  participants: Participant[];
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}
export interface CreateChatPayload {
  name?: string;
  participants: string[];
  groupPic?: string;
}


export interface Participant {
  id: string;
  username: string;
  profilePic: string;
}

export interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  status: string;
}