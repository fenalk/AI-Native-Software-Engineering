import { useSession } from '../../../session/session-context.js'
import { SideMenu } from '../../organisms/SideMenu/SideMenu.jsx'

/**
 * Shell shared by feed, post detail, publish and about pages: side menu plus a
 * content column capped at the 1200px layout from the Figma file.
 */
export function AppTemplate({ active = 'feed', children }) {
  const { isAuthenticated, signOut } = useSession()

  return (
    <div className="min-h-svh bg-canvas">
      <div className="mx-auto flex w-full max-w-[1248px] flex-col gap-6 px-4 py-8 lg:flex-row lg:gap-7 lg:px-6 lg:py-14">
        <SideMenu
          active={active}
          isAuthenticated={isAuthenticated}
          onSignOut={signOut}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
