import { useAuth } from "../../context/authContext";
import { useGetChats } from "../../hooks/api/chat";


export function ChatsPage() {
  const { token, logout } = useAuth();
  const { data, isLoading, error } = useGetChats();

  if (isLoading) {
    return <div>Loading chats...</div>;
  }

  if (error) {
    return <div>Failed to load chats</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Chats</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {data?.chats.map((chat) => (
          <li
            key={chat.id}
            style={{
              padding: 12,
              borderBottom: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {chat.isGroup ? chat.name : chat.participants[0]?.username}
            </div>

            {chat.lastMessage && (
              <div style={{ fontSize: 14, color: "#555" }}>
                {chat.lastMessage.content}
              </div>
            )}

            {chat.unreadCount > 0 && (
              <span style={{ color: "red", fontSize: 12 }}>
                {chat.unreadCount} unread
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
