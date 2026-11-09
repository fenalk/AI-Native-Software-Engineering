export function BrandMark({ className, title }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : 'true'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <g
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M63 74V67a22 22 0 0 0-22-22h-8a22 22 0 0 0-22 22v41a22 22 0 0 0 22 22h8a22 22 0 0 0 22-22v-9" />
        <path d="M55 58V32a22 22 0 0 1 22-22h10a22 22 0 0 1 22 22v48a22 22 0 0 1-22 22H77a22 22 0 0 1-22-22v-6" />
      </g>
    </svg>
  )
}
