import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--sand)] relative overflow-hidden">
      {/* Blob backgrounds */}
      <div className="blob-1 fixed top-[-150px] right-[-100px] w-[500px] h-[500px] bg-[var(--sage-light)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 z-0" />
      <div className="blob-2 fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--terracotta)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between bg-gradient-to-b from-[var(--sand)] to-transparent">
        <Link href="/" className="font-[var(--font-fraunces)] text-[28px] font-semibold text-[var(--earth)]">
          fotofocinho
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-[460px] w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-[var(--sage)]/15 rounded-full">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>

          <h1 className="font-[var(--font-fraunces)] text-5xl md:text-6xl font-medium text-[var(--earth)] mb-3">
            404
          </h1>
          <h2 className="font-[var(--font-fraunces)] text-2xl font-medium text-[var(--earth)] mb-4">
            Page not found
          </h2>
          <p className="text-[var(--text-muted)] text-base leading-relaxed mb-8">
            Parece que essa página saiu para passear. Vamos voltar para o início?
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-[var(--terracotta)] text-white text-[15px] font-bold rounded-full transition-all hover:bg-[var(--terracotta-dark)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)]"
          >
            Back to homepage
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
