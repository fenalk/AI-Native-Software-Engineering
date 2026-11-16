import { AboutPage } from './pages/AboutPage/AboutPage.jsx'
import { AccountPage } from './pages/AccountPage/AccountPage.jsx'
import { FeedPage } from './pages/FeedPage/FeedPage.jsx'
import { LoginPage } from './pages/LoginPage/LoginPage.jsx'
import { PostPage } from './pages/PostPage/PostPage.jsx'
import { PublishPage } from './pages/PublishPage/PublishPage.jsx'
import { RegisterPage } from './pages/RegisterPage/RegisterPage.jsx'
import { SessionProvider } from './session/SessionProvider.jsx'

const ROUTES = {
  '/': 'feed',
  '/feed': 'feed',
  '/publicar': 'publish',
  '/login': 'login',
  '/cadastro': 'register',
  '/conta': 'account',
  '/sobre': 'about',
}

// Post ids are UUIDs: anything else (`/posts/%2F`, `/posts/abc`) falls through
// to the unknown-route page instead of rendering `PostPage` and calling the API.
const POST_PATH =
  /^\/posts\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i

const defaultNavigate = (path) => window.location.assign(path)

function withSession(element, navigate) {
  return <SessionProvider navigate={navigate}>{element}</SessionProvider>
}

export default function App({
  path = window.location.pathname,
  navigate = defaultNavigate,
}) {
  const postMatch = path.match(POST_PATH)

  if (postMatch) {
    return withSession(
      <PostPage postId={postMatch[1]} navigate={navigate} />,
      navigate,
    )
  }

  const route = ROUTES[path]

  if (route === 'account') {
    return <AccountPage navigate={navigate} />
  }

  if (route === 'register') {
    return <RegisterPage navigate={navigate} />
  }

  if (route === 'publish') {
    return withSession(<PublishPage navigate={navigate} />, navigate)
  }

  if (route === 'about') {
    return withSession(<AboutPage />, navigate)
  }

  if (route === 'feed') {
    return withSession(<FeedPage navigate={navigate} />, navigate)
  }

  return <LoginPage navigate={navigate} />
}
