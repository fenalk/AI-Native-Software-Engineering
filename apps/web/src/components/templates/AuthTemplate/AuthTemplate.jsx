import { BrandWatermark } from '../../molecules/BrandWatermark/BrandWatermark.jsx'

export function AuthTemplate({ banner, children }) {
  return (
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden p-10 px-6 max-[520px]:p-5 max-[520px]:px-4">
      <BrandWatermark />
      <div className="relative z-10 grid w-max max-w-full grid-cols-[minmax(0,407px)_minmax(0,346px)] items-center gap-16 rounded-4xl border border-edge bg-surface p-14 px-[78px] shadow-card max-[990px]:w-[min(100%,600px)] max-[990px]:grid-cols-1 max-[990px]:gap-8 max-[990px]:p-8 max-[520px]:gap-6 max-[520px]:rounded-[18px] max-[520px]:p-5">
        <div className="flex min-w-0">{banner}</div>
        <div className="flex min-w-0 flex-col justify-center">{children}</div>
      </div>
    </main>
  )
}
