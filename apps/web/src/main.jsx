import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

const titles = {
  '/': 'Code Connect | Feed',
  '/feed': 'Code Connect | Feed',
  '/publicar': 'Code Connect | Publicar',
  '/login': 'Code Connect | Login',
  '/cadastro': 'Code Connect | Cadastro',
  '/conta': 'Code Connect | Minha conta',
  '/sobre': 'Code Connect | Sobre nós',
}

const path = window.location.pathname
const title = /^\/posts\/[^/]+\/?$/.test(path)
  ? 'Code Connect | Post'
  : (titles[path] ?? 'Code Connect | Login')

document.title = title

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App path={path} />
  </StrictMode>,
)
