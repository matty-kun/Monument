export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#f6f7f6] px-5 py-8 dark:bg-[#0b0b0c] lg:px-12" aria-label="Loading admin workspace">
      <div className="mx-auto max-w-7xl animate-pulse space-y-7">
        <div className="h-4 w-44 rounded bg-[#e7ebe8] dark:bg-[#27272a]" />
        <div className="space-y-3">
          <div className="h-9 w-64 rounded bg-[#dfe5e1] dark:bg-[#2f2f33]" />
          <div className="h-4 w-80 max-w-full rounded bg-[#e7ebe8] dark:bg-[#27272a]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 rounded-md border border-[#dfe3e1] bg-white dark:border-white/10 dark:bg-[#18181a]" />
          ))}
        </div>
        <div className="h-72 rounded-md border border-[#dfe3e1] bg-white dark:border-white/10 dark:bg-[#18181a]" />
      </div>
    </main>
  );
}
