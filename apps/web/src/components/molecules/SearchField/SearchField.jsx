import { Icon } from '../../atoms/Icon/Icon.jsx'

export function SearchField({ value, onChange, placeholder }) {
  return (
    <div className="flex min-h-16 items-center gap-4 rounded bg-surface px-4 py-2 text-ink-soft">
      <Icon name="search" size="md" className="shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? 'Digite o que você procura'}
        aria-label="Buscar posts"
        className="w-full bg-transparent text-xl leading-normal text-ink-soft outline-none placeholder:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
    </div>
  )
}
