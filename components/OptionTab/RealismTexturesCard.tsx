"use client";
import { GlobalSettings } from '@/lib/types';
import React from 'react';
import { AnimatedCheckbox } from '@/components/ui/AnimatedCheckbox';

type Props = {
  settings: GlobalSettings;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
};

export const RealismTexturesCard = ({ settings, onUpdateSettings }: Props) => {
  return (
    <div className="rounded-xl bg-[#14141d] border border-[#232332] p-3 flex flex-col gap-2">
      <label className="group flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-[#1c1c28]">
        <span className="font-semibold text-primary text-xs transition-colors group-hover:brightness-125">Paper Texture</span>
        <AnimatedCheckbox
          checked={settings.paperTexture}
          onChange={(v) => onUpdateSettings({ paperTexture: v })}
          color="primary"
        />
      </label>

      <label className="group flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-[#1c1c28]">
        <span className="font-semibold text-primary text-xs transition-colors group-hover:brightness-125">Ink Bleed</span>
        <AnimatedCheckbox
          checked={settings.inkBleed}
          onChange={(v) => onUpdateSettings({ inkBleed: v })}
          color="primary"
        />
      </label>

      <label className="group flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-[#0f1e1a]">
        <span className="font-semibold text-teal-400 text-xs transition-colors group-hover:brightness-125">Scanner Effect (Shadows)</span>
        <AnimatedCheckbox
          checked={settings.scannerEffect}
          onChange={(v) => onUpdateSettings({ scannerEffect: v })}
          color="teal"
        />
      </label>

      <div className="flex flex-col gap-1">
        <label className="group flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-[#1c1c28]">
          <span className="font-semibold text-primary text-xs transition-colors group-hover:brightness-125">Export Background (White Paper)</span>
          <AnimatedCheckbox
            checked={settings.exportBackground}
            onChange={(v) => onUpdateSettings({ exportBackground: v })}
            color="primary"
          />
        </label>
        <span className="text-[10px] text-zinc-500 leading-tight px-2.5">
          OFF – transparent background (useful for overlays).
        </span>
      </div>
    </div>
  );
};
