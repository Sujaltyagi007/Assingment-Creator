import { GlobalSettings } from '@/lib/types'
import React from 'react'

type Props = {
    settings: GlobalSettings;
    onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
    applyPreset: (preset: "standard" | "cbse") => void;
}

export const MarginCard = ({ onUpdateSettings, settings, applyPreset }: Props) => {
    return (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#14141d] dark:border-[#232332] p-3 flex flex-col gap-3 transition-colors duration-200">
            <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
                    MARGINS
                </span>
                <div className="flex gap-1.5">
                    <button key="std" type="button"
                        onClick={() => applyPreset("standard")}
                        className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase transition-colors cursor-pointer ${settings.marginPreset === "standard"
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 dark:bg-[#0b0b10] dark:border-[#272738] dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                    >
                        Std
                    </button>
                    <button
                        key="cbse"
                        type="button"
                        onClick={() => applyPreset("cbse")}
                        className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase transition-colors cursor-pointer ${settings.marginPreset === "cbse"
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 dark:bg-[#0b0b10] dark:border-[#272738] dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                    >
                        CBSE
                    </button>
                </div>
            </div>

            {/* Top Margin */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Top Margin</span>
                    <span className="text-zinc-500 font-mono text-[9px]">(Header)</span>
                </div>
                <input
                    type="range"
                    min={40}
                    max={200}
                    value={settings.topMargin}
                    onChange={(e) => onUpdateSettings({ topMargin: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>

            {/* Left Margin */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Left Margin</span>
                    <span className="text-zinc-500 font-mono text-[9px]">(Holes)</span>
                </div>
                <input
                    type="range"
                    min={40}
                    max={250}
                    value={settings.leftMargin}
                    onChange={(e) => onUpdateSettings({ leftMargin: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>
        </div>
    )
}