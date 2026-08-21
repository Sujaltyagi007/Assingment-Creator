"use client";
import { Fragment, useState } from 'react';
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
      <span className="font-bold text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <path d="M10 9H8" />
          <path d="M14 2v5a1 1 0 0 0 1 1h5" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
        </svg>
        Export
      </span>

      <div className="flex rounded-lg overflow-hidden border border-zinc-300 dark:border-[#272738] bg-white dark:bg-[#0b0b10]">
        {(["png", "pdf"] as const).map((fmt) => (
          <button key={fmt} type="button" onClick={() => onUpdateSettings({ exportFormat: fmt })} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${settings.exportFormat === fmt ? "bg-primary text-white shadow-[inset_0_0_12px_rgba(255,85,51,0.25)]" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"}`}>
            {fmt === "png" ? (
              <Fragment>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                PNG
              </Fragment>
            ) : (
              <Fragment>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                PDF
              </Fragment>
            )}
          </button>
        ))}
      </div>

      {!isPDF && (
        <Select value={settings.exportQuality} onValueChange={(val) => onUpdateSettings({ exportQuality: val as "standard" | "fullhd" | "ultrahd" })}>
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

      <label className="group flex items-center justify-between cursor-pointer rounded-lg bg-white border border-zinc-300 text-zinc-800 dark:bg-[#0b0b10] dark:border-[#272738] p-2.5 transition-all duration-300 hover:border-primary/40 hover:bg-zinc-100 dark:hover:bg-[#12121a]">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs transition-colors group-hover:text-zinc-950 dark:group-hover:text-zinc-100">
          High Compression
          <span className="ml-1 text-zinc-400 dark:text-zinc-600 font-normal">(smaller file)</span>
        </span>
        <AnimatedCheckbox checked={settings.highCompression} onChange={(v) => onUpdateSettings({ highCompression: v })} color="primary" />
      </label>
      <div className="flex items-center justify-between rounded-lg bg-white border border-zinc-300 dark:bg-[#0b0b10] dark:border-[#272738] px-2.5 py-2">
        <span className="text-zinc-500 text-xs">Est. size</span>
        <span className="text-zinc-800 dark:text-zinc-200 text-xs font-bold tabular-nums tracking-wide">{sizeLabel}</span>
      </div>

      <button type="button" onClick={handleExport} disabled={isExporting} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/30 py-2.5 text-primary font-bold text-xs hover:bg-primary/20 hover:border-primary/60 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
        {isExporting ? (
          <Fragment>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Exporting…</span>
          </Fragment>
        ) : (
          <Fragment>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export as {isPDF ? "PDF (all pages)" : "PNG (current page)"}</span>
          </Fragment>
        )}
      </button>
    </div>
  );
};
