import { LoginPage } from './pages/LoginPage/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage/RegisterPage.jsx'

const ROUTES = {
  '/': 'login',
  '/login': 'login',
  '/cadastro': 'register',
}

export default function App({ path = window.location.pathname }) {
  const route = ROUTES[path]

  if (route === 'register') {
    return <RegisterPage />
  }

  return <LoginPage />
}
