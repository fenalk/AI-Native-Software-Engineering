import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

const titles = {
  '/cadastro': 'Code Connect | Cadastro',
  '/login': 'Code Connect | Login',
}

const path = window.location.pathname
document.title = titles[path] ?? 'Code Connect | Login'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App path={path} />
  </StrictMode>,
)
