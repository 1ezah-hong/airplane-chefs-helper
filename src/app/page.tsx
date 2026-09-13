import Link from 'next/link';

export default function Home() {
  return <main className="flex min-h-dvh w-full min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_80%_18%,#8CBEE455,transparent_32%),radial-gradient(circle_at_12%_68%,#F5966E22,transparent_28%),linear-gradient(#F2F8FD,#CFE6F4_52%,#93C0DE)] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[#13193D]">
    <div className="flex w-full flex-1 flex-col">
      <header>
        <h1 aria-label="Chefs Help Chefs" className="text-[clamp(3.5rem,15vw,5.5rem)] font-bold leading-[.92] tracking-[-.06em]">
          <span className="block">Chefs Help</span>
          <span className="block">Chefs</span>
        </h1>
        <p className="mt-3 text-base font-medium tracking-[-.02em] text-[#48607A]">Smarter plans. More stars.</p>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center py-12 text-center" aria-label="纽约入口">
        <p className="text-sm font-medium text-[#48607A]">欢迎来到</p>
        <h2 className="mt-2 text-[clamp(4.5rem,21vw,6.5rem)] font-bold leading-none tracking-[-.06em]">纽约</h2>
        <Link href="/new-york" className="mt-8 flex min-h-14 w-full items-center justify-center rounded-[18px] bg-[#13193D] px-6 text-base font-semibold text-[#F8F2EA] shadow-[0_8px_24px_rgba(19,25,61,.28)]">点击进入 →</Link>
      </section>

      <p className="pt-8 text-center text-xs text-[#5B7089]">更多城市即将开放</p>
    </div>
  </main>;
}
