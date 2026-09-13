import Link from 'next/link';

export default function Home() {
  return <main className="min-h-dvh bg-[linear-gradient(#F2F8FD,#CFE6F4_52%,#93C0DE)] px-6 pt-40 text-[#13193D]">
    <p className="text-[11px] font-medium tracking-[.18em]">CHEFS HELP CHEFS</p>
    <h1 className="mt-3 text-5xl font-bold tracking-tight">选择机场</h1>
    <section className="mt-16" aria-label="机场列表">
      <p className="text-sm text-[#48607A]">欢迎来到</p><h2 className="mt-1 text-6xl font-bold tracking-tight">纽约</h2>
      <Link href="/new-york" className="mt-6 inline-flex rounded-[18px] bg-[#13193D] px-6 py-4 text-base font-semibold text-[#F8F2EA] shadow-[0_8px_24px_rgba(19,25,61,.28)]">点击进入 →</Link>
    </section>
    <section className="mt-14 text-sm text-[#48607A]" aria-label="即将开放的机场"><h2 className="font-medium">上海、巴黎、东京等城市 <span className="rounded-full bg-white/60 px-2 py-1 text-xs">暂未开放</span></h2></section>
  </main>;
}
