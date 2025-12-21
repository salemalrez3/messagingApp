import { useEffect } from "react";
import { socket } from "./socket";

export function useSocket(token: string | null) {
  useEffect(() => {
    if (!token) return;

    socket.auth = { token }; // sent to io.use(authMiddleware)
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socket;
}
