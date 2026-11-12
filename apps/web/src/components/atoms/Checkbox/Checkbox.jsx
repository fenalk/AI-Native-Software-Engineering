function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.6467 3.09725C13.995 3.28748 14.1043 3.6933 13.8909 4.00367L8.2081 12.2655C7.67814 13.036 6.52043 13.2352 5.70659 12.696L2.29837 10.4377C1.97054 10.2205 1.90239 9.80763 2.14617 9.51551C2.38994 9.22339 2.85332 9.16267 3.18115 9.37989L6.58938 11.6381C6.70564 11.7152 6.87103 11.6867 6.94674 11.5766L12.6295 3.31479C12.843 3.00442 13.2984 2.90702 13.6467 3.09725Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function Checkbox({
  checked = false,
  className = '',
  id,
  label,
  name,
  onChange,
}) {
  return (
    <label
      className={[
        'group inline-flex min-h-6 cursor-pointer select-none items-center gap-2 text-sm leading-normal text-muted',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className="grid size-6 shrink-0 place-items-center rounded border-2 border-field text-accent transition-colors [&_svg]:opacity-0 [&_svg]:transition-opacity peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        aria-hidden="true"
      >
        <CheckIcon />
      </span>
      <span className="group-hover:text-ink">{label}</span>
    </label>
  )
}
