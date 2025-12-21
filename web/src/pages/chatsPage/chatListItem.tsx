// src/components/ChatListItem.tsx
import React from "react";
import type { Chat } from "../../types/chatTypes";

type Props = {
  chat: Chat;
  selected?: boolean;
  onClick?: () => void;
};

export const ChatListItem: React.FC<Props> = ({ chat, selected, onClick }) => {
  const last = chat.lastMessage;
  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        borderBottom: "1px solid #eee",
        background: selected ? "#f5f5f5" : "white",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 600 }}>{chat.name ?? chat.participants.map(p => p.username).join(", ")}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            {last ? `${last.senderId === "you" ? "You: " : ""}${last.content.slice(0, 80)}` : "No messages"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12 }}>{new Date(chat.updatedAt).toLocaleString()}</div>
          {chat.unreadCount > 0 && (
            <div style={{ background: "#0e6432", color: "white", borderRadius: 12, padding: "2px 8px", marginTop: 6 }}>
              {chat.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
