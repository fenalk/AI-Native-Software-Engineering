import { TextInput } from '../../atoms/TextInput/TextInput.jsx'

export function FormField({
  autoComplete,
  id,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
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
      />
    </div>
  )
}
