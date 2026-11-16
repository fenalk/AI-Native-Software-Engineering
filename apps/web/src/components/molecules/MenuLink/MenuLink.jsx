import { Icon } from '../../atoms/Icon/Icon.jsx'

/**
 * Menu item used by the side bar. Renders a link when `href` is passed and a
 * button otherwise (the "Sair" action).
 */
export function MenuLink({ active = false, href, icon, label, onClick }) {
  const classes = [
    'flex flex-col items-center justify-center gap-2 rounded-lg px-4 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    active ? 'text-ink' : 'text-muted hover:text-accent',
  ].join(' ')

  const content = (
    <>
      <Icon name={icon} size="md" />
      <span className="text-xl leading-normal">{label}</span>
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    )
  }

  return (
    <a href={href} className={classes} aria-current={active ? 'page' : undefined}>
      {content}
    </a>
  )
}
