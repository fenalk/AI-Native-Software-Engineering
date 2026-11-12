export function AuthHeader({ title, description }) {
  return (
    <header className="flex flex-col gap-6">
      <h1 className="m-0 text-3xl font-semibold leading-normal text-ink">
        {title}
      </h1>
      <p className="m-0 text-xl leading-normal text-ink">{description}</p>
    </header>
  )
}
