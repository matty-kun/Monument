"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Smartphone } from "lucide-react";
import Image from "next/image";

export default function MobileOnlyWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/admin-login")) {
    return <div className="flex flex-col min-h-screen">{children}</div>;
  }

  return (
    <>
      {/* Mobile Content */}
      <div className="md:hidden flex flex-col min-h-screen w-full">
        {children}
      </div>

      {/* Desktop gate for the public, event-day experience */}
      <div className="fixed inset-0 z-[9999] hidden overflow-hidden bg-[#f5f5f7] px-8 text-[#111311] transition-colors dark:bg-black dark:text-white md:flex">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#269a7a]" aria-hidden="true" />

        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col py-10">
          <header className="flex items-center justify-between border-b border-black/10 pb-5 dark:border-white/15">
            <div className="flex items-center gap-3">
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
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold tracking-normal text-black/50 dark:text-white/50">
              <span className="h-2 w-2 rounded-full bg-[#269a7a]" aria-hidden="true" />
              Mobile experience
            </div>
          </header>

          <main className="grid flex-1 items-center gap-16 border-b border-black/10 py-12 dark:border-white/15 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-normal text-[#217f66] dark:text-[#67c9aa]">
                Viewing notice
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-[1.04] tracking-normal lg:text-6xl">
                Take the scoreboard with you.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-7 tracking-normal text-black/55 dark:text-white/55">
                Monument&apos;s public tournament experience is available on mobile. Open this page on your phone to continue.
              </p>
            </div>

            <div className="flex min-h-80 items-center border-l-4 border-[#269a7a] pl-12">
              <div>
                <Smartphone className="h-24 w-24 text-[#111311] dark:text-white" strokeWidth={1.25} aria-hidden="true" />
                <div className="mt-8 border-t border-black/15 pt-5 dark:border-white/20">
                  <p className="text-[11px] font-bold uppercase tracking-normal text-black/40 dark:text-white/40">
                    Supported view
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-normal">Mobile</p>
                </div>
              </div>
            </div>
          </main>

          <footer className="flex items-center justify-between pt-5 text-[11px] font-semibold uppercase tracking-normal text-black/40 dark:text-white/40">
            <span>Monument</span>
            <span>Live tournament standings</span>
          </footer>
        </div>
      </div>
    </>
  );
}
