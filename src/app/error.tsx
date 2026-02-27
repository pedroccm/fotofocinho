"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--sand)] relative overflow-hidden">
      <div className="blob-1 fixed top-[-150px] right-[-100px] w-[500px] h-[500px] bg-[var(--sage-light)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 z-0" />
      <div className="blob-2 fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--terracotta)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 z-0" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-[460px] w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-red-500/10 rounded-full">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C75050" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="font-[var(--font-fraunces)] text-3xl md:text-4xl font-medium text-[var(--earth)] mb-3">
            Something went wrong
          </h1>
          <p className="text-[var(--text-muted)] text-base leading-relaxed mb-8">
            Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-8 py-4 bg-[var(--terracotta)] text-white text-[15px] font-bold rounded-full transition-all hover:bg-[var(--terracotta-dark)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)]"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-8 py-4 border-2 border-[var(--sage)] text-[var(--sage-dark)] text-[15px] font-bold rounded-full transition-all hover:bg-[var(--sage)] hover:text-white"
            >
              Back to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
