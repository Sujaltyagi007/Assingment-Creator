import { GlobalSettings } from '@/lib/types';
import React from 'react';
import { HeaderFooterCard } from './HeaderFooterCard';
import { GeneralTogglesCard } from './GeneralTogglesCard';
import { RealismTexturesCard } from './RealismTexturesCard';
import { ExportQualityCard } from './ExportQualityCard';
import { SaveLoadCard } from './SaveLoadCard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type OptionsProps = {
  settings: GlobalSettings;
  pageCount: number;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
  onExportPNG: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  onSaveDocument?: () => void;
  onLoadDocument?: (file: File) => void;
};

export const Options = ({ settings, pageCount, onUpdateSettings, onExportPNG, onExportPDF, onSaveDocument, onLoadDocument }: OptionsProps) => {
  return (
    <div className="flex flex-col gap-4 text-xs">
      <div className="rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#14141d] dark:border-[#232332] p-3 flex items-center justify-between transition-colors duration-200">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-primary text-xs">Appearance Theme</span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Toggle between Dark & Light Mode</span>
        </div>
        <ThemeToggle variant="pill" />
      </div>
      <HeaderFooterCard settings={settings} onUpdateSettings={onUpdateSettings} />
      <GeneralTogglesCard settings={settings} onUpdateSettings={onUpdateSettings} />
      <RealismTexturesCard settings={settings} onUpdateSettings={onUpdateSettings} />
      <SaveLoadCard onSaveDocument={onSaveDocument} onLoadDocument={onLoadDocument} />
      <ExportQualityCard settings={settings} pageCount={pageCount} onUpdateSettings={onUpdateSettings} onExportPNG={onExportPNG} onExportPDF={onExportPDF} />
    </div>
  );
};

export default Options;