import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthPage } from '../pages/authPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: < AuthPage/>,
  },
  {
    path: '/about',
    element: < div/>,
  },
  {
    path: '/users/:id',
    element: < div/>,
  },
]);
