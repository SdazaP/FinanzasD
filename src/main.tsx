import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import AuthProvider from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RequireAuth>
          <App />
        </RequireAuth>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
