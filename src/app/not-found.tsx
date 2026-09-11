import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f5f5f7] px-5 pb-28 text-[#111311] transition-colors dark:bg-black dark:text-white sm:px-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#269a7a]" aria-hidden="true" />

      <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col justify-center py-12">
        <header className="flex items-center justify-between border-b border-black/10 pb-5 dark:border-white/15">
          <Link href="/" className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#269a7a] focus:ring-offset-4 dark:focus:ring-offset-black">
            <Image
              src="/monument-logo.png"
              alt="Monument"
              width={36}
              height={36}
              className="h-9 w-9 rounded-md object-cover"
              priority
            />
            <div>
              <p className="text-sm font-bold leading-none tracking-normal">Monument</p>
              <p className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-normal text-black/45 dark:text-white/45">
                Tournament center
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold tracking-normal text-black/50 dark:text-white/50">
            <span className="h-2 w-2 rounded-full bg-[#ff453a]" aria-hidden="true" />
            Page unavailable
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 border-b border-black/10 py-10 dark:border-white/15 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] md:gap-16 md:py-16">
          <div className="relative flex min-h-48 items-center border-l-4 border-[#269a7a] pl-6 sm:pl-10 md:min-h-72">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-normal text-[#217f66] dark:text-[#67c9aa]">
                Final
              </p>
              <h1 className="text-[112px] font-black tabular-nums leading-[0.82] tracking-normal sm:text-[176px]">
                404
              </h1>
            </div>
          </div>

          <div className="max-w-md">
            <p className="mb-3 text-xs font-bold uppercase tracking-normal text-black/45 dark:text-white/45">
              Page not found
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
              That page isn&apos;t on the schedule.
            </h2>
            <p className="mt-4 text-[15px] leading-6 tracking-normal text-black/55 dark:text-white/55">
              The address may have changed, or the event page may no longer be available.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#111311] px-5 text-sm font-semibold tracking-normal text-white transition-colors hover:bg-[#269a7a] focus:outline-none focus:ring-2 focus:ring-[#269a7a] focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-[#67c9aa] dark:focus:ring-offset-black"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Return to podium
              </Link>
              <Link
                href="/schedule"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-5 text-sm font-semibold tracking-normal text-[#111311] transition-colors hover:bg-black/[0.04] focus:outline-none focus:ring-2 focus:ring-[#269a7a] focus:ring-offset-2 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus:ring-offset-black"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                View scores
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between pt-5 text-[11px] font-semibold uppercase tracking-normal text-black/40 dark:text-white/40">
          <span>Monument</span>
          <span>Live tournament standings</span>
        </footer>
      </main>
    </div>
  );
}
