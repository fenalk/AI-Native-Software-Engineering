import { Link } from '../../atoms/Link/Link.jsx'
import { MenuLink } from '../../molecules/MenuLink/MenuLink.jsx'

const LOGO_SRC = '/logo-code-connect.svg'

/**
 * Shared side navigation. The last item switches between Login and Sair,
 * depending on whether the stored session is valid.
 */
export function SideMenu({ active, isAuthenticated, onSignOut }) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-10 rounded-lg bg-surface px-4 py-10 lg:w-[177px]">
      <a
        href="/feed"
        className="mx-auto inline-flex rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        aria-label="Code Connect — ir para o feed"
      >
        <img
          src={LOGO_SRC}
          alt="Code Connect"
          width="127"
          height="40"
          className="h-10 w-[127px]"
        />
      </a>

      <div className="flex flex-col gap-10">
        <Link
          href={isAuthenticated ? '/publicar' : '/login'}
          variant="outline"
        >
          Publicar
        </Link>

        <nav
          aria-label="Menu principal"
          className="flex flex-row flex-wrap justify-center gap-4 lg:flex-col lg:gap-10"
        >
          <MenuLink
            icon="feed"
            label="Feed"
            href="/feed"
            active={active === 'feed'}
          />
          <MenuLink
            icon="account_circle"
            label="Perfil"
            href="/conta"
            active={active === 'profile'}
          />
          <MenuLink
            icon="info"
            label="Sobre nós"
            href="/sobre"
            active={active === 'about'}
          />

          {isAuthenticated ? (
            <MenuLink icon="logout" label="Sair" onClick={onSignOut} />
          ) : (
            <MenuLink icon="login" label="Login" href="/login" />
          )}
        </nav>
      </div>
    </aside>
  )
}
