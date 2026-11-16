import { TextInput } from '../../atoms/TextInput/TextInput.jsx'

export function FormField({
  autoComplete,
  error,
  id,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-lg font-normal leading-normal text-ink"
        htmlFor={id}
      >
        {label}
      </label>
      <TextInput
        id={id}
        name={name ?? id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        invalid={Boolean(error)}
        describedBy={errorId}
      />
      {error ? (
        <p id={errorId} className="text-sm leading-normal text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
