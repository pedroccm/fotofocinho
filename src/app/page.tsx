"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ResultCheckoutFlow from "@/components/ResultCheckoutFlow";
import { STYLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("renaissance");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Imagem muito grande. Máximo 10MB.");
        return;
      }
      setUploadedFile(file);
      setError(null);
      setGeneratedImage(null);
      setGenerationId(null);
      const reader = new FileReader();
      reader.onload = (e) => setUploadedPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleGenerate = async () => {
    if (!uploadedFile) return;
    setIsGenerating(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("style", selectedStyle);
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar retrato");
      setGeneratedImage(data.watermarkedImage);
      setGenerationId(data.generationId);
      // Scroll to result section
      setTimeout(() => {
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar retrato. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setGenerationId(null);
    setUploadedFile(null);
    setUploadedPreview(null);
    setError(null);
    setTimeout(() => {
      document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[var(--sand)] relative overflow-hidden">
      {/* Blob backgrounds */}
      <div className="blob-1 fixed top-[-150px] right-[-100px] w-[500px] h-[500px] bg-[var(--sage-light)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 z-0" />
      <div className="blob-2 fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--terracotta)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between bg-gradient-to-b from-[var(--sand)] to-transparent">
        <Link href="/" className="font-['Fraunces'] text-[28px] font-semibold text-[var(--earth)]">
          fotofocinho
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <a href="#process" className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-[var(--text)] hover:bg-[var(--sage)]/20">Processo</a>
          <a href="#gallery" className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-[var(--text)] hover:bg-[var(--sage)]/20">Galeria</a>
          <a href={generatedImage ? "#result" : "#upload"} className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-[var(--text)] hover:bg-[var(--sage)]/20">
            {generatedImage ? "Resultado" : "Preços"}
          </a>
          {user ? (
            <Link href="/minha-conta" className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-[var(--text)] hover:bg-[var(--sage)]/20">Minha Conta</Link>
          ) : (
            <Link href="/login" className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-[var(--text)] hover:bg-[var(--sage)]/20">Entrar</Link>
          )}
          <a href="#upload" className="px-5 py-2.5 text-sm font-bold text-white bg-[var(--sage)] rounded-full transition-all hover:bg-[var(--sage-dark)]">Começar</a>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="min-h-screen flex items-center px-6 md:px-12 pt-[120px] pb-[60px]">
          <div className="max-w-[1200px] mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="max-w-[520px]">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--cream)] border-2 border-[var(--sage-light)] rounded-full text-[13px] font-semibold text-[var(--sage-dark)] mb-6">
                Feito com carinho
              </div>
              <h1 className="font-['Fraunces'] text-[44px] md:text-[60px] font-medium leading-[1.1] text-[var(--earth)] mb-6">
                Seu pet como <span className="text-[var(--terracotta)] italic">obra de arte</span>
              </h1>
              <p className="text-lg text-[var(--text-muted)] leading-relaxed mb-10">
                Criamos retratos artísticos únicos do seu melhor amigo, combinando inteligência artificial com estilos clássicos de pintura.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#upload" className="inline-flex items-center gap-2.5 px-8 py-4 bg-[var(--terracotta)] text-white text-[15px] font-bold rounded-full transition-all hover:bg-[var(--terracotta-dark)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)]">
                  Criar retrato
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
                <a href="#gallery" className="inline-flex items-center gap-2.5 px-8 py-4 bg-transparent border-2 border-[var(--sage)] text-[var(--sage-dark)] text-[15px] font-bold rounded-full transition-all hover:bg-[var(--sage)] hover:text-white">
                  Ver galeria
                </a>
              </div>
            </div>

            {/* Polaroid Stack */}
            <div className="relative h-[400px] md:h-[500px] hidden md:block">
              <div className="absolute w-[240px] md:w-[280px] bg-white p-4 pb-12 rounded shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:!rotate-0 hover:scale-105 hover:z-10" style={{ top: 20, left: 20, transform: "rotate(-8deg)" }}>
                <img src="/samples/output/dog1/renaissance.jpg" alt="Max - Renascença" className="w-full h-[200px] md:h-[260px] object-cover rounded-sm" />
                <span className="absolute bottom-3 left-0 right-0 text-center font-['Fraunces'] text-sm text-[var(--text-muted)]">Max - Renascença</span>
              </div>
              <div className="absolute w-[240px] md:w-[280px] bg-white p-4 pb-12 rounded shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:!rotate-0 hover:scale-105 hover:z-10 z-[1]" style={{ top: 60, left: 140, transform: "rotate(5deg)" }}>
                <img src="/samples/output/gato/baroque.jpg" alt="Luna - Barroco" className="w-full h-[200px] md:h-[260px] object-cover rounded-sm" />
                <span className="absolute bottom-3 left-0 right-0 text-center font-['Fraunces'] text-sm text-[var(--text-muted)]">Luna - Barroco</span>
              </div>
              <div className="absolute w-[240px] md:w-[280px] bg-white p-4 pb-12 rounded shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:!rotate-0 hover:scale-105 hover:z-10 z-[2]" style={{ top: 180, left: 60, transform: "rotate(-3deg)" }}>
                <img src="/samples/output/dog2/victorian.jpg" alt="Thor - Vitoriano" className="w-full h-[200px] md:h-[260px] object-cover rounded-sm" />
                <span className="absolute bottom-3 left-0 right-0 text-center font-['Fraunces'] text-sm text-[var(--text-muted)]">Thor - Vitoriano</span>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload" className="py-[80px] px-6 md:px-12">
          <div className="max-w-[680px] mx-auto text-center">
            <span className="inline-block text-xs font-bold tracking-[0.15em] uppercase text-[var(--sage)] mb-3">CRIAR RETRATO</span>
            <h2 className="font-['Fraunces'] text-[36px] md:text-[44px] font-medium text-[var(--earth)] mb-4">Envie a foto do seu pet</h2>
            <p className="text-[17px] text-[var(--text-muted)] mb-10">Uma foto clara e bem iluminada vai gerar o melhor resultado</p>

            <div
              className={"w-full min-h-[220px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden " + (dragOver ? "border-[var(--terracotta)] bg-[var(--terracotta)]/10" : "border-[var(--sage-light)] bg-[var(--cream)] hover:border-[var(--sage)] hover:bg-[var(--sage)]/5")}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
              {uploadedPreview ? (
                <div className="relative flex flex-col items-center p-4">
                  <img src={uploadedPreview} alt="Pet" className="max-w-full max-h-[400px] w-auto h-auto object-contain rounded-xl shadow-md" />
                  <p className="mt-3 text-[13px] text-[var(--text-muted)]">Clique para trocar a foto</p>
                </div>
              ) : (
                <>
                  <div className="relative mb-4 p-5 bg-[var(--sand)] rounded-2xl">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-[var(--earth)]">Arraste ou clique para enviar</p>
                  <p className="text-[13px] text-[var(--text-muted)] mt-1">JPG ou PNG até 10MB</p>
                </>
              )}
            </div>

            {uploadedPreview && (
              <div className="mt-8">
                <p className="text-sm font-semibold text-[var(--sage)] mb-4 tracking-wider">Escolha o estilo</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      className={"px-5 py-3 rounded-full border-2 text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 " + (selectedStyle === s.id ? "border-[var(--terracotta)] bg-[var(--terracotta)]/10 text-[var(--terracotta)]" : "border-[var(--sage-light)] bg-[var(--cream)] text-[var(--text)] hover:border-[var(--sage)]")}
                      onClick={(e) => { e.stopPropagation(); setSelectedStyle(s.id); }}
                    >
                      <span>{s.emoji}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
                {error && <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">{error}</div>}
                <button
                  className="mt-8 w-full py-4 rounded-full bg-[var(--terracotta)] text-white text-base font-bold transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--terracotta-dark)] hover:shadow-[0_12px_40px_rgba(193,127,89,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full inline-block animate-spin" />
                      Criando sua obra-prima...
                    </span>
                  ) : "Gerar Retrato"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-[100px] px-6 md:px-12">
          <div className="text-center max-w-[600px] mx-auto mb-16">
            <span className="inline-block text-xs font-bold tracking-[0.15em] uppercase text-[var(--sage)] mb-3">COMO FUNCIONA</span>
            <h2 className="font-['Fraunces'] text-[36px] md:text-[44px] font-medium text-[var(--earth)] mb-4">Simples e encantador</h2>
            <p className="text-[17px] text-[var(--text-muted)]">Três passos para eternizar seu companheiro</p>
          </div>
          <div className="bg-[var(--cream)] rounded-[32px] p-8 md:p-16 max-w-[1000px] mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { num: "1", title: "Envie a foto", desc: "Escolha uma foto clara do seu pet. Pode ser do celular mesmo!" },
                { num: "2", title: "Escolha o estilo", desc: "Renascença, Barroco, Vitoriano... qual combina mais com seu pet?" },
                { num: "3", title: "Receba sua arte", desc: "Em minutos, seu retrato está pronto para decorar sua casa." },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-[var(--sand)] rounded-full">
                    <span className="font-['Fraunces'] text-[28px] font-semibold text-[var(--terracotta)]">{step.num}</span>
                  </div>
                  <h3 className="font-['Fraunces'] text-[22px] font-medium text-[var(--earth)] mb-3">{step.title}</h3>
                  <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="py-[100px] px-6 md:px-12">
          <div className="text-center max-w-[600px] mx-auto mb-16">
            <span className="inline-block text-xs font-bold tracking-[0.15em] uppercase text-[var(--sage)] mb-3">ESTILOS</span>
            <h2 className="font-['Fraunces'] text-[36px] md:text-[44px] font-medium text-[var(--earth)] mb-4">Nossa galeria</h2>
            <p className="text-[17px] text-[var(--text-muted)]">Cada estilo conta uma história diferente</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {[
              { img: "/samples/output/dog3/renaissance.jpg", name: "Renascença", desc: "Clássico e atemporal" },
              { img: "/samples/output/gato2/baroque.jpg", name: "Barroco", desc: "Dramático e elegante" },
              { img: "/samples/output/dog4/victorian.jpg", name: "Vitoriano", desc: "Nobre e majestoso" },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--cream)] rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]">
                <img src={item.img} alt={item.name} className="w-full h-[280px] md:h-[320px] object-cover" />
                <div className="p-6 text-center">
                  <h3 className="font-['Fraunces'] text-xl font-medium text-[var(--earth)] mb-1">{item.name}</h3>
                  <span className="text-sm text-[var(--text-muted)]">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Result + Checkout Flow (inline, replaces modals) */}
        {generatedImage && generationId && (
          <ResultCheckoutFlow
            generatedImage={generatedImage}
            generationId={generationId}
            onReset={handleReset}
          />
        )}

        {/* Footer */}
        <footer className="py-12 px-6 md:px-12 text-center border-t border-black/5">
          <div className="font-['Fraunces'] text-[28px] font-semibold text-[var(--earth)] mb-2">fotofocinho</div>
          <p className="text-sm text-[var(--text-muted)]">2025 Fotofocinho. Feito com amor para pets.</p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        .blob-1 { animation: morph 15s ease-in-out infinite; }
        .blob-2 { animation: morph 20s ease-in-out infinite reverse; }
      `}</style>
    </div>
  );
}
