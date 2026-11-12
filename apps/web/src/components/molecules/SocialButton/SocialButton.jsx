const ICON_SIZE_CLASSES = {
  md: 'h-[30px]',
  lg: 'h-8',
}

export function SocialButton({ href = '#', icon, iconSize = 'md', label }) {
  return (
    <a
      href={href}
      className="group flex flex-col items-center gap-1 text-xs leading-normal text-ink no-underline focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <span className="grid h-8 place-items-center transition-transform group-hover:-translate-y-0.5">
        <img
          className={['w-auto object-contain', ICON_SIZE_CLASSES[iconSize]]
            .filter(Boolean)
            .join(' ')}
          src={icon}
          alt=""
        />
      </span>
      <span>{label}</span>
    </a>
  )
}
