import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './config/router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function App() {
  const [count, setCount] = useState(0)
  const queryClient = new QueryClient();

  return (
    <>
    <QueryClientProvider client={queryClient}>
<RouterProvider router={router} />
</QueryClientProvider>
    </>
  )
}

export default App
