"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { STYLES } from "@/lib/constants";

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16", group: "P" },
  { value: "2:3", label: "2:3", group: "P" },
  { value: "3:4", label: "3:4", group: "P" },
  { value: "4:5", label: "4:5", group: "P" },
  { value: "1:1", label: "1:1", group: "-" },
  { value: "5:4", label: "5:4", group: "L" },
  { value: "4:3", label: "4:3", group: "L" },
  { value: "3:2", label: "3:2", group: "L" },
  { value: "16:9", label: "16:9", group: "L" },
];

const MODELS = [
  { id: "google/gemini-2.5-flash-image", label: "Nano Banana (2.5 Flash)" },
  { id: "google/gemini-3.1-flash-image-preview", label: "Nano Banana 2 (3.1 Flash)" },
  { id: "google/gemini-3-pro-image-preview", label: "Nano Banana Pro (3 Pro)" },
];

interface ModelResult {
  model: string;
  label: string;
  image: string | null;
  error: string | null;
  cost: string | null;
  status: "idle" | "generating" | "done" | "error";
}

export default function TestPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("renaissance");
  const [ratios, setRatios] = useState<Record<string, string>>(
    Object.fromEntries(MODELS.map((m) => [m.id, "4:5"]))
  );
  const [results, setResults] = useState<ModelResult[]>(
    MODELS.map((m) => ({
      model: m.id,
      label: m.label,
      image: null,
      error: null,
      cost: null,
      status: "idle",
    }))
  );
  const [generatingModel, setGeneratingModel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image too large. Max 10MB.");
        return;
      }
      setUploadedFile(file);
      // Reset results when new file uploaded
      setResults(MODELS.map((m) => ({
        model: m.id,
        label: m.label,
        image: null,
        error: null,
        cost: null,
        status: "idle",
      }));
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

  const handleGenerate = async (modelId: string) => {
    if (!uploadedFile) return;

    setGeneratingModel(modelId);
    setResults((prev) =>
      prev.map((r) =>
        r.model === modelId
          ? { ...r, status: "generating", error: null, image: null }
          : r
      )
    );

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("style", selectedStyle);
      formData.append("model", modelId);
      formData.append("ratio", ratios[modelId]);

      const res = await fetch("/api/test-generate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setResults((prev) =>
          prev.map((r) =>
            r.model === modelId
              ? { ...r, status: "error", error: data.error || "Failed" }
              : r
          )
        );
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.model === modelId
              ? {
                  ...r,
                  status: "done",
                  image: data.image,
                  cost: data.cost,
                }
              : r
          )
        );
      }
    } catch (err) {
      setResults((prev) =>
        prev.map((r) =>
          r.model === modelId
            ? { ...r, status: "error", error: err instanceof Error ? err.message : "Failed" }
            : r
        )
      );
    } finally {
      setGeneratingModel(null);
    }
  };

  const anyGenerating = generatingModel !== null;

  const RatioSelect = ({ modelId, label }: { modelId: string; label: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-[var(--text-muted)] whitespace-nowrap">{label}</span>
      <select
        value={ratios[modelId]}
        onChange={(e) => setRatios((prev) => ({ ...prev, [modelId]: e.target.value }))}
        disabled={anyGenerating}
        className="px-2.5 py-1.5 bg-[var(--cream)] border border-[var(--sage-light)] rounded-lg text-xs font-semibold text-[var(--earth)] cursor-pointer focus:outline-none focus:border-[var(--sage)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <optgroup label="Portrait">
          {ASPECT_RATIOS.filter((r) => r.group === "P").map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </optgroup>
        <optgroup label="Square">
          {ASPECT_RATIOS.filter((r) => r.group === "-").map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </optgroup>
        <optgroup label="Landscape">
          {ASPECT_RATIOS.filter((r) => r.group === "L").map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );

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
            Upload a photo and click each model button to generate individually
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

          {/* Style selector + Ratio controls */}
          {uploadedPreview && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-[var(--sage)] mb-3 tracking-wider text-center">Choose style</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    disabled={anyGenerating}
                    className={"px-4 py-2.5 rounded-full border-2 text-sm font-semibold flex items-center gap-2 transition-all " + (selectedStyle === s.id ? "border-[var(--terracotta)] bg-[var(--terracotta)]/10 text-[var(--terracotta)]" : "border-[var(--sage-light)] bg-[var(--cream)] text-[var(--text)] hover:border-[var(--sage)]") + (anyGenerating ? " opacity-50 cursor-not-allowed" : "")}
                    onClick={() => setSelectedStyle(s.id)}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>

              {/* Aspect ratio selectors */}
              <div className="mt-5 flex flex-wrap gap-3 justify-center items-center">
                {MODELS.map((m) => (
                  <RatioSelect key={m.id} modelId={m.id} label={m.label.split(" (")[0] + ":"} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {uploadedPreview && (
          <div className="grid md:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
            {results.map((r, i) => (
              <div key={i} className="bg-[var(--cream)] rounded-2xl border border-[var(--sage-light)]/30 overflow-hidden">
                {/* Model label + button */}
                <div className="px-5 py-3 border-b border-[var(--sage-light)]/20 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--earth)]">{r.label}</span>
                  <span className="text-[11px] text-[var(--text-muted)] bg-[var(--sand)] px-2 py-0.5 rounded-full">
                    {ratios[r.model]}
                  </span>
                </div>

                {/* Generate button or status */}
                <div className="px-5 py-4 flex flex-col items-center gap-3">
                  {r.status === "idle" && (
                    <button
                      onClick={() => handleGenerate(r.model)}
                      disabled={anyGenerating}
                      className="w-full py-2.5 rounded-full bg-[var(--terracotta)] text-white text-sm font-bold transition-all hover:bg-[var(--terracotta-dark)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate
                    </button>
                  )}

                  {r.status === "generating" && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 border-2 border-[var(--sage-light)] border-t-[var(--terracotta)] rounded-full animate-spin" />
                      <span className="text-sm text-[var(--text-muted)]">Generating...</span>
                    </div>
                  )}

                  {r.status === "done" && r.image && (
                    <div className="w-full">
                      <img src={r.image} alt={r.label} className="w-full h-auto rounded-lg mb-2" />
                      {r.cost && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-[var(--text-muted)]">Cost:</span>
                          <span className="font-bold font-mono text-[var(--earth)]">${r.cost}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {r.status === "error" && (
                    <div className="text-center">
                      <p className="text-sm text-red-500 font-medium mb-2">Failed</p>
                      <p className="text-xs text-[var(--text-muted)]">{r.error}</p>
                      <button
                        onClick={() => handleGenerate(r.model)}
                        disabled={anyGenerating}
                        className="mt-3 px-4 py-1.5 rounded-full border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Retry
                      </button>
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
