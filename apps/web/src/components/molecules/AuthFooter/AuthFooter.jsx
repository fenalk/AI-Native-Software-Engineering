import { Link } from '../../atoms/Link/Link.jsx'

export function AuthFooter({ question, linkLabel, linkHref, icon }) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-2 text-lg leading-normal max-[520px]:flex-col max-[520px]:items-start">
      <span className="text-ink">{question}</span>
      <Link href={linkHref} variant="accent">
        {linkLabel}
        {icon}
      </Link>
    </p>
  )
}
