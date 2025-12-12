// Generated types for Messages

export interface GetMessagesParams {
  chatId: string;
  limit?: number;
  cursor?: string;
}

export interface GetMessagesResponse {
  // Based on 200 response (no specific schema)
}

export interface SendMessageParams {
  chatId: string;
}

export interface SendMessagePayload {
  text: string;
}

export interface SendMessageResponse {
  // Based on 201 response (no specific schema)
}