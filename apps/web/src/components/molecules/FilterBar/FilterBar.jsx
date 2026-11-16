import { Tag } from '../../atoms/Tag/Tag.jsx'

/**
 * Tag filter chips. Chips render in the order returned by `GET /tags`; selected
 * ones stay marked with a close icon and can be toggled off.
 */
export function FilterBar({ tags, selected, onToggle, onClear }) {
  const hasSelection = selected.length > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.slug)

          return (
            <Tag
              key={tag.slug}
              tone={isSelected ? 'field' : 'soft'}
              pressed={isSelected}
              onClick={() => onToggle(tag.slug)}
              removeLabel={`Remover filtro ${tag.name}`}
            >
              {tag.name}
            </Tag>
          )
        })}
      </div>

      {hasSelection ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded text-lg leading-normal text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Limpar tudo
        </button>
      ) : null}
    </div>
  )
}
