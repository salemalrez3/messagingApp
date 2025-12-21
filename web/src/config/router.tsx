import { createBrowserRouter } from "react-router-dom";
import { AuthPage } from "../pages/auth/authPage";
import { RequireAuth } from "../components/RequireAuth";
import { ChatsPage } from "../pages/chatsPage/chatsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthPage />,
  },
  {
    path: "/chats",
    element: (
      <RequireAuth>
        <ChatsPage/>
      </RequireAuth>
    ),
  },

]);
