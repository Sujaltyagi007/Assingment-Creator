"use client";
import { GlobalSettings } from '@/lib/types';
import React from 'react';
import { AnimatedCheckbox } from '@/components/ui/AnimatedCheckbox';

type Props = {
  settings: GlobalSettings;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
};

export const GeneralTogglesCard = ({ settings, onUpdateSettings }: Props) => {
  return (
    <div className="rounded-xl bg-[#14141d] border border-[#232332] p-3 flex flex-col gap-2">
      <label className="group flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-[#1c1c28]">
        <span className="font-semibold text-primary text-xs group-hover:brightness-125 transition-all">Show Date &amp; Page No</span>
        <AnimatedCheckbox
          checked={settings.showDatePageNo}
          onChange={(v) => onUpdateSettings({ showDatePageNo: v })}
          color="primary"
        />
      </label>

      <label className="group flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-[#1c1c28]">
        <span className="font-semibold text-primary text-xs group-hover:brightness-125 transition-all">Auto–Correct (English)</span>
        <AnimatedCheckbox
          checked={settings.autoCorrect}
          onChange={(v) => onUpdateSettings({ autoCorrect: v })}
          color="primary"
        />
      </label>

      <div className="rounded-lg bg-[#0f1b15] border border-[#1b3d2b] p-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-emerald-400 text-xs">Performance Mode (Preview)</span>
          <span className="text-[10px] text-emerald-600/90 leading-tight">
            ON – smoother typing/preview (Export quality stays same).
          </span>
        </div>
        <AnimatedCheckbox
          checked={settings.performanceMode}
          onChange={(v) => onUpdateSettings({ performanceMode: v })}
          color="emerald"
        />
      </div>

      <div className="rounded-lg bg-[#1c1214] border border-[#3d1d23] p-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-rose-400 text-xs">Anti–Copy Pattern</span>
          <span className="text-[10px] text-rose-600/90 leading-tight">
            Adds faint interference lines to prevent OCR.
          </span>
        </div>
        <AnimatedCheckbox
          checked={settings.antiCopyPattern}
          onChange={(v) => onUpdateSettings({ antiCopyPattern: v })}
          color="rose"
        />
      </div>

      <div className="rounded-lg bg-[#1a121d] border border-[#381c3e] p-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-fuchsia-400 text-xs">Smart Q&amp;A (Auto Color)</span>
          <span className="text-[10px] text-fuchsia-400/80 leading-tight">
            &quot;Q: ...&quot; – Black Bold, &quot;Ans: ...&quot; – Blue.
          </span>
        </div>
        <AnimatedCheckbox
          checked={settings.smartQA}
          onChange={(v) => onUpdateSettings({ smartQA: v })}
          color="fuchsia"
        />
      </div>

      <div className="rounded-lg bg-[#111726] border border-[#1e2a47] p-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-blue-400 text-xs">Auto Headings (Blue/Black)</span>
          <span className="text-[10px] text-blue-400/80 leading-tight">
            ALL CAPS lines become Black (English Only).
          </span>
        </div>
        <AnimatedCheckbox
          checked={settings.autoHeadings}
          onChange={(v) => onUpdateSettings({ autoHeadings: v })}
          color="blue"
        />
      </div>
    </div>
  );
};
