import { GlobalSettings } from '@/lib/types';
import React from 'react';
import { HeaderFooterCard } from './OptionTab/HeaderFooterCard';
import { GeneralTogglesCard } from './OptionTab/GeneralTogglesCard';
import { RealismTexturesCard } from './OptionTab/RealismTexturesCard';
import { ExportQualityCard } from './OptionTab/ExportQualityCard';

type OptionsProps = {
  settings: GlobalSettings;
  pageCount: number;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
  onExportPNG: () => Promise<void>;
  onExportPDF: () => Promise<void>;
};

export const Options = ({ settings, pageCount, onUpdateSettings, onExportPNG, onExportPDF }: OptionsProps) => {
  return (
    <div className="flex flex-col gap-4 text-xs">
      <HeaderFooterCard settings={settings} onUpdateSettings={onUpdateSettings} />
      <GeneralTogglesCard settings={settings} onUpdateSettings={onUpdateSettings} />
      <RealismTexturesCard settings={settings} onUpdateSettings={onUpdateSettings} />
      <ExportQualityCard settings={settings} pageCount={pageCount} onUpdateSettings={onUpdateSettings} onExportPNG={onExportPNG} onExportPDF={onExportPDF} />
    </div>
  );
};

export default Options;