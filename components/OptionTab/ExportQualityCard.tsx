"use client";
import { useState } from 'react';
import { GlobalSettings } from '@/lib/types';
import { AnimatedCheckbox } from '@/components/ui/AnimatedCheckbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDocument } from '@/lib/state/DocumentContext';
import { useRef } from 'react';

type Props = {
  settings: GlobalSettings;
  pageCount: number;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
  onExportPNG: () => Promise<void>;
  onExportPDF: () => Promise<void>;
};

export const ExportQualityCard = ({ settings, pageCount, onUpdateSettings, onExportPNG, onExportPDF }: Props) => {
  const { doc, dispatch } = useDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const isPDF = settings.exportFormat === "pdf";

  // Empirical per-page MB averages (handwriting canvas content)
  const PER_PAGE_MB: Record<string, number> = {
    "png-standard": 0.55,
    "png-fullhd": 1.60,
    "png-ultrahd": 3.80,
    "pdf-high": 0.45,
    "pdf-normal": 1.20,
  };
  const key = isPDF
    ? (settings.highCompression ? "pdf-high" : "pdf-normal")
    : `png-${settings.exportQuality}`;
  const totalMB = (PER_PAGE_MB[key] ?? 1) * (isPDF ? pageCount : 1);
  const sizeLabel = totalMB >= 1 ? `~${totalMB.toFixed(1)} MB` : `~${Math.round(totalMB * 1024)} KB`;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (isPDF) await onExportPDF();
      else await onExportPNG();
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveWorkFile = () => {
    const jsonStr = JSON.stringify(doc);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadWorkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        dispatch({ type: "LOAD_DOCUMENT", document: parsed });
      } catch (err) {
        console.error("Failed to load work file", err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#14141d] dark:border-[#232332] p-3 flex flex-col gap-3 transition-colors duration-200">
      <span className="font-bold text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
        📄 Export
      </span>

      <div className="flex rounded-lg overflow-hidden border border-zinc-300 dark:border-[#272738] bg-white dark:bg-[#0b0b10]">
        {(["png", "pdf"] as const).map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => onUpdateSettings({ exportFormat: fmt })}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${settings.exportFormat === fmt
              ? "bg-primary text-white shadow-[inset_0_0_12px_rgba(255,85,51,0.25)]"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
          >
            {fmt === "png" ? "🖼️ PNG" : "📑 PDF"}
          </button>
        ))}
      </div>

      {/* Quality dropdown — hidden for PDF since resolution is set by canvas */}
      {!isPDF && (
        <Select value={settings.exportQuality} onValueChange={(val) => onUpdateSettings({ exportQuality: val as "standard" | "fullhd" | "ultrahd" })}        >
          <SelectTrigger className="w-full rounded-lg bg-white border border-zinc-300 text-zinc-800 dark:bg-[#0b0b10] dark:border-[#272738] dark:text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-primary text-xs cursor-pointer h-8 justify-between">
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-zinc-200 text-zinc-800 dark:bg-[#0b0b10] dark:border-[#272738] dark:text-zinc-200 text-xs">
            <SelectItem value="ultrahd" className="hover:bg-primary/10 focus:bg-primary/10 text-zinc-800 dark:text-zinc-200 cursor-pointer">Ultra HD (Large Size)</SelectItem>
            <SelectItem value="fullhd" className="hover:bg-primary/10 focus:bg-primary/10 text-zinc-800 dark:text-zinc-200 cursor-pointer">Full HD (1080p)</SelectItem>
            <SelectItem value="standard" className="hover:bg-primary/10 focus:bg-primary/10 text-zinc-800 dark:text-zinc-200 cursor-pointer">Standard HD (Fast)</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Compression toggle */}
      <label className="group flex items-center justify-between cursor-pointer rounded-lg bg-white border border-zinc-300 text-zinc-800 dark:bg-[#0b0b10] dark:border-[#272738] p-2.5 transition-all duration-300 hover:border-primary/40 hover:bg-zinc-100 dark:hover:bg-[#12121a]">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs transition-colors group-hover:text-zinc-950 dark:group-hover:text-zinc-100">
          High Compression
          <span className="ml-1 text-zinc-400 dark:text-zinc-600 font-normal">(smaller file)</span>
        </span>
        <AnimatedCheckbox
          checked={settings.highCompression}
          onChange={(v) => onUpdateSettings({ highCompression: v })}
          color="primary"
        />
      </label>

      {/* Estimated size */}
      <div className="flex items-center justify-between rounded-lg bg-white border border-zinc-300 dark:bg-[#0b0b10] dark:border-[#272738] px-2.5 py-2">
        <span className="text-zinc-500 text-xs">Est. size</span>
        <span className="text-zinc-800 dark:text-zinc-200 text-xs font-bold tabular-nums tracking-wide">{sizeLabel}</span>
      </div>

      {/* Export button — optimistic */}
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/30 py-2.5 text-primary font-bold text-xs hover:bg-primary/20 hover:border-primary/60 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isExporting ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Exporting…</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export as {isPDF ? "PDF (all pages)" : "PNG (current page)"}</span>
          </>
        )}
      </button>

      <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

      {/* Save / Load Work File */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSaveWorkFile}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 py-2 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          Save Project
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 py-2 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Load Project
        </button>
        <input type="file" ref={fileInputRef} onChange={handleLoadWorkFile} accept=".json" className="hidden" />
      </div>
    </div>
  );
};
