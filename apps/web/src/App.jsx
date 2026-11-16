import { AccountPage } from './pages/AccountPage/AccountPage.jsx'
import { LoginPage } from './pages/LoginPage/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage/RegisterPage.jsx'

const ROUTES = {
  '/': 'login',
  '/login': 'login',
  '/cadastro': 'register',
  '/conta': 'account',
}

export default function App({ path = window.location.pathname }) {
  const route = ROUTES[path]

  if (route === 'account') {
    return <AccountPage />
  }

  if (route === 'register') {
    return <RegisterPage />
  }

  return <LoginPage />
}
