"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { STYLES } from "@/lib/constants";

interface ModelResult {
  model: string;
  label: string;
  image: string | null;
  error: string | null;
}

export default function TestPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("renaissance");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<ModelResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image too large. Max 10MB.");
        return;
      }
      setUploadedFile(file);
      setError(null);
      setResults(null);
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
    setResults(null);
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("style", selectedStyle);
      const res = await fetch("/api/test-generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const placeholders: ModelResult[] = [
    { model: "aiml", label: "AIML (Gemini 2.5 Flash)", image: null, error: null },
    { model: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash (OpenRouter)", image: null, error: null },
  ];

  const displayResults = results || (isGenerating ? placeholders : null);

  return (
    <div className="min-h-screen bg-[var(--sand)]">
      {/* Header */}
      <nav className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-black/5">
        <Link href="/" className="font-[var(--font-fraunces)] text-[24px] font-semibold text-[var(--earth)]">
          fotofocinho
        </Link>
        <span className="px-3 py-1 bg-[var(--sage)]/10 border border-[var(--sage-light)] rounded-full text-xs font-semibold text-[var(--sage-dark)]">
          Model Comparison
        </span>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-10">
        {/* Upload + Controls */}
        <div className="max-w-[600px] mx-auto mb-10">
          <h1 className="font-[var(--font-fraunces)] text-[32px] font-medium text-[var(--earth)] mb-2 text-center">
            Model Comparison
          </h1>
          <p className="text-[15px] text-[var(--text-muted)] text-center mb-8">
            Upload a pet photo and compare results from both AI providers side by side
          </p>

          {/* Upload area */}
          <div
            className={"w-full min-h-[180px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 " + (dragOver ? "border-[var(--terracotta)] bg-[var(--terracotta)]/10" : "border-[var(--sage-light)] bg-[var(--cream)] hover:border-[var(--sage)] hover:bg-[var(--sage)]/5")}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
            {uploadedPreview ? (
              <div className="relative flex flex-col items-center p-4">
                <img src={uploadedPreview} alt="Pet" className="max-w-full max-h-[300px] w-auto h-auto object-contain rounded-xl shadow-md" />
                <p className="mt-2 text-[13px] text-[var(--text-muted)]">Click to change photo</p>
              </div>
            ) : (
              <>
                <div className="mb-3 p-4 bg-[var(--sand)] rounded-2xl">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[var(--earth)]">Drag or click to upload</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1">JPG or PNG up to 10MB</p>
              </>
            )}
          </div>

          {/* Style selector */}
          {uploadedPreview && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-[var(--sage)] mb-3 tracking-wider text-center">Choose style</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    className={"px-4 py-2.5 rounded-full border-2 text-sm font-semibold flex items-center gap-2 transition-all " + (selectedStyle === s.id ? "border-[var(--terracotta)] bg-[var(--terracotta)]/10 text-[var(--terracotta)]" : "border-[var(--sage-light)] bg-[var(--cream)] text-[var(--text)] hover:border-[var(--sage)]")}
                    onClick={() => setSelectedStyle(s.id)}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>

              {error && <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">{error}</div>}

              <button
                className="mt-6 w-full py-3.5 rounded-full bg-[var(--terracotta)] text-white text-base font-bold transition-all hover:bg-[var(--terracotta-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full inline-block animate-spin" />
                    Generating with both models...
                  </span>
                ) : "Generate with Both Models"}
              </button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {displayResults && (
          <div className="grid md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
            {displayResults.map((r, i) => (
              <div key={i} className="bg-[var(--cream)] rounded-2xl border border-[var(--sage-light)]/30 overflow-hidden">
                {/* Model label */}
                <div className="px-5 py-3 border-b border-[var(--sage-light)]/20 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--earth)]">{r.label}</span>
                  {r.image && (
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                  {r.error && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                  {!r.image && !r.error && isGenerating && (
                    <span className="w-4 h-4 border-2 border-[var(--sage-light)] border-t-[var(--sage)] rounded-full animate-spin" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 min-h-[300px] flex items-center justify-center">
                  {r.image ? (
                    <img src={r.image} alt={r.label} className="w-full h-auto rounded-lg" />
                  ) : r.error ? (
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-red-500/10 rounded-full">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-500 font-medium">Failed</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{r.error}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 border-3 border-[var(--sage-light)] border-t-[var(--sage)] rounded-full animate-spin" />
                      <p className="text-sm text-[var(--text-muted)]">Generating...</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
