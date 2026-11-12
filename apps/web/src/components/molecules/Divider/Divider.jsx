export function Divider({ children }) {
  return (
    <div
      className="flex items-center gap-4 whitespace-nowrap text-sm leading-normal text-ink"
      role="separator"
    >
      <span className="h-px flex-1 bg-ink" aria-hidden="true" />
      <span className="shrink-0 text-center">{children}</span>
      <span className="h-px flex-1 bg-ink" aria-hidden="true" />
    </div>
  )
}
