import { BrandMark } from '../../atoms/BrandMark/BrandMark.jsx'

export function BrandWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden text-accent"
      aria-hidden="true"
    >
      <BrandMark className="absolute -left-[6%] -top-[16%] w-[min(38vw,560px)] -rotate-6 opacity-[0.045]" />
      <BrandMark className="absolute -bottom-[22%] -right-[7%] w-[min(36vw,540px)] rotate-[172deg] opacity-[0.045]" />
    </div>
  )
}
