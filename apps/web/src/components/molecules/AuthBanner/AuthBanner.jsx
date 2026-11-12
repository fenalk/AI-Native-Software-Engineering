const LOGO_SRC = '/logo-code-connect.svg'

export function AuthBanner({ src, alt, logo = true }) {
  return (
    <figure className="relative m-0 aspect-[407/675] w-full overflow-hidden rounded-[26px] bg-banner max-[990px]:aspect-[407/312]">
      <img
        className="absolute inset-0 size-full object-cover object-center"
        src={src}
        alt={alt}
      />
      {logo ? (
        <img
          className="absolute bottom-[30px] left-1/2 h-10 w-32 -translate-x-1/2 max-[990px]:bottom-4 max-[990px]:h-[30px] max-[990px]:w-24"
          src={LOGO_SRC}
          alt="Code Connect"
          width="128"
          height="40"
        />
      ) : null}
    </figure>
  )
}
