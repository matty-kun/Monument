type BoneProps = {
  className?: string;
};

function Bone({ className = "" }: BoneProps) {
  return (
    <div
      className={`animate-pulse bg-black/[0.09] dark:bg-white/[0.11] motion-reduce:animate-none ${className}`}
    />
  );
}

const glassPanel =
  "border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(255,255,255,0.46))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[linear-gradient(145deg,rgba(28,28,30,0.8),rgba(28,28,30,0.65))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_40px_rgba(0,0,0,0.28)]";

function PublicSkeletonShell({
  label,
  children,
  darkOnly = false,
}: {
  label: string;
  children: React.ReactNode;
  darkOnly?: boolean;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={`relative min-h-[100dvh] overflow-hidden pb-28 font-sans ${
        darkOnly
          ? "bg-black text-white"
          : "bg-[#F5F5F7] text-gray-900 dark:bg-black dark:text-white"
      }`}
    >
      {children}
    </div>
  );
}

export function PodiumSkeleton() {
  return (
    <PublicSkeletonShell label="Loading standings">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(to_bottom,rgba(22,163,74,0.18),transparent)]"
      />

      <div aria-hidden="true" className="relative z-10 px-4 pb-8 pt-12">
        <div className="mb-12 flex flex-col items-center gap-3">
          <Bone className="h-8 w-52 rounded-lg" />
          <Bone className="h-3 w-32 rounded" />
        </div>

        <div className="mx-auto max-w-md px-2 pt-7">
          <div className="grid grid-cols-[1fr_1.08fr_1fr] items-end gap-2">
            {[
              { avatar: "h-[76px] w-[76px]", podium: "h-[104px]" },
              { avatar: "h-[104px] w-[104px]", podium: "h-[142px]" },
              { avatar: "h-[70px] w-[70px]", podium: "h-[88px]" },
            ].map((item, index) => (
              <div key={index} className="flex min-w-0 flex-col items-center">
                <div className="flex h-[190px] w-full flex-col items-center justify-end">
                  <div className="relative">
                    <Bone className={`${item.avatar} rounded-full`} />
                    <Bone className="absolute -right-1 -top-1 h-7 w-7 rounded-full" />
                  </div>
                  <Bone className="mt-3 h-4 w-20 max-w-[86%] rounded" />
                  <Bone className="mt-2 h-3 w-12 rounded" />
                  <Bone className="mt-2 h-4 w-16 rounded" />
                </div>
                <div className={`${item.podium} w-full rounded-t-[18px] border-x border-t border-black/[0.08] bg-white/25 dark:border-white/[0.12] dark:bg-white/[0.06]`}>
                  <Bone className="mx-auto mt-6 h-3 w-14 rounded" />
                  <Bone className="mx-auto mt-3 h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicSkeletonShell>
  );
}

export function ScheduleSkeleton() {
  return (
    <PublicSkeletonShell label="Loading matches">
      <div aria-hidden="true" className="relative z-10">
        <div className="px-4 pb-4 pt-6">
          <Bone className="mb-4 h-9 w-32 rounded-lg" />
          <div className="flex h-10 gap-2 rounded-xl border border-black/[0.05] bg-black/[0.04] p-1 dark:border-white/10 dark:bg-white/10">
            {[0, 1, 2, 3].map((tab) => (
              <Bone key={tab} className="h-full flex-1 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className={`${glassPanel} mb-7 flex h-11 items-center gap-3 rounded-xl px-3`}>
            <Bone className="h-4 w-4 rounded-full" />
            <Bone className="h-4 w-40 rounded" />
          </div>

          {[3, 2].map((rowCount, groupIndex) => (
            <div key={groupIndex} className="mb-7">
              <Bone className="mb-3 ml-1 h-4 w-44 rounded" />
              <div className={`${glassPanel} overflow-hidden rounded-[24px]`}>
                {Array.from({ length: rowCount }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex h-[88px] items-center gap-3 border-b border-black/[0.05] px-4 last:border-b-0 dark:border-white/[0.07]"
                  >
                    <Bone className="h-10 w-10 rounded-xl" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Bone className="h-4 w-3/5 rounded" />
                      <Bone className="h-3 w-2/5 rounded" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Bone className="h-4 w-14 rounded" />
                      <Bone className="h-3 w-10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicSkeletonShell>
  );
}

export function HistorySkeleton() {
  return (
    <PublicSkeletonShell label="Loading history">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-64 pointer-events-none z-0"
        style={{ background: "linear-gradient(to bottom, rgba(10,132,255,0.15) 0%, transparent 100%)" }}
      />

      <div aria-hidden="true" className="relative z-10 px-4 pb-8 pt-10">
        <div className="flex items-center gap-3">
          <Bone className="h-9 w-32 rounded-lg" />
        </div>
        <Bone className="mt-3 h-4 w-72 max-w-[88%] rounded" />

        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-5 rounded-[24px] border border-white/[0.03] bg-white/[0.01] backdrop-blur-3xl overflow-hidden h-[90px]"
            >
              <div className="flex items-center gap-5">
                <div className="flex items-center justify-center w-10">
                  <Bone className="h-6 w-6 rounded-full" />
                </div>
                <div className="space-y-3">
                  <Bone className="h-5 w-40 rounded" />
                  <Bone className="h-2.5 w-20 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4 pr-1">
                <Bone className="h-5 w-5 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicSkeletonShell>
  );
}

export function UpdatesSkeleton() {
  return (
    <PublicSkeletonShell label="Loading updates" darkOnly>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(to_bottom,rgba(38,154,122,0.22),transparent)]"
      />

      <div aria-hidden="true" className="relative z-10 px-4 pb-8 pt-10">
        <Bone className="mb-3 h-3 w-32 rounded" />
        <Bone className="h-9 w-36 rounded-lg" />
        <Bone className="mt-3 h-4 w-72 max-w-[88%] rounded" />

        <div className="mt-7 overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex gap-3 border-b border-white/[0.07] px-4 py-4 last:border-b-0"
            >
              <Bone className="h-10 w-10 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <Bone className="h-4 w-36 rounded" />
                  <Bone className="h-3 w-12 rounded" />
                </div>
                <Bone className="mt-3 h-3 w-11/12 rounded" />
                <Bone className="mt-3 h-2.5 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicSkeletonShell>
  );
}

export function ResultsSkeleton() {
  return (
    <PublicSkeletonShell label="Loading results" darkOnly>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(to_bottom,rgba(22,163,74,0.18),transparent)]"
      />

      <div aria-hidden="true" className="relative z-10 px-4 pb-8 pt-6">
        <Bone className="h-9 w-28 rounded-lg" />
        <div className="mt-8 flex h-11 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.08] px-3 backdrop-blur-xl">
          <Bone className="h-4 w-4 rounded-full" />
          <Bone className="h-4 w-44 rounded" />
        </div>

        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="rounded-[18px] border border-white/[0.07] bg-white/[0.09] p-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <div className="flex items-center gap-2">
                  <Bone className="h-7 w-7 rounded-lg" />
                  <Bone className="h-4 w-36 rounded" />
                </div>
                <Bone className="h-3 w-16 rounded" />
              </div>
              <div className="mt-4 space-y-4">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Bone className="h-5 w-5 rounded-full" />
                    <Bone className="h-4 flex-1 rounded" />
                    <Bone className="h-7 w-7 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicSkeletonShell>
  );
}

export function TeamHistorySkeleton() {
  return (
    <PublicSkeletonShell label="Loading team history" darkOnly>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(to_bottom,rgba(22,163,74,0.18),transparent)]"
      />

      <div aria-hidden="true" className="relative z-10 pb-8">
        <div className="flex h-14 items-center px-4">
          <Bone className="h-5 w-24 rounded" />
        </div>

        <div className="mt-6 flex flex-col items-center px-4">
          <Bone className="h-28 w-28 rounded-full" />
          <Bone className="mt-5 h-8 w-48 rounded-lg" />
          <Bone className="mt-3 h-4 w-20 rounded" />
        </div>

        <div className="mt-8 px-4">
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.09] p-5 backdrop-blur-xl">
            <div className="flex flex-col items-center border-b border-white/[0.07] pb-5">
              <Bone className="h-3 w-20 rounded" />
              <Bone className="mt-3 h-12 w-20 rounded-lg" />
            </div>
            <div className="mt-5 flex justify-around">
              {[0, 1, 2].map((medal) => (
                <div key={medal} className="flex w-24 flex-col items-center gap-2">
                  <Bone className="h-7 w-7 rounded-full" />
                  <Bone className="h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 px-4">
          <div className="flex h-11 gap-2 rounded-xl border border-white/[0.07] bg-white/[0.09] p-1">
            {[0, 1, 2, 3].map((tab) => (
              <Bone key={tab} className="h-full flex-1 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3 px-4">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex h-[82px] items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.09] p-4 backdrop-blur-xl"
            >
              <Bone className="h-9 w-9 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Bone className="h-4 w-3/5 rounded" />
                <Bone className="h-3 w-2/5 rounded" />
              </div>
              <Bone className="h-4 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>
    </PublicSkeletonShell>
  );
}
