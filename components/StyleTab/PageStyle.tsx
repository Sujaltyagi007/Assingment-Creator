import { GlobalSettings } from '@/lib/types'
import React from 'react'

type Props = {
    onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
    settings: GlobalSettings;
}

const PageStyle = ({ onUpdateSettings, settings }: Props) => {
    return (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#14141d] dark:border-[#232332] p-3 flex flex-col gap-2 transition-colors duration-200">
            <span className="font-bold text-primary text-[11px] uppercase tracking-wider flex items-center gap-1">
                🗒️ PAGE STYLE
            </span>
            <div className="grid grid-cols-3 gap-2">
                {(["ruled", "blank", "graph"] as const).map((style) => (
                    <button key={style} type="button" onClick={() => onUpdateSettings({ paperStyle: style })}
                        className={`rounded-lg py-2 text-xs font-semibold capitalize border transition-colors cursor-pointer ${settings.paperStyle === style ? "bg-primary/10 border-primary text-primary" : "bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 dark:bg-[#0b0b10] dark:border-[#272738] dark:text-zinc-400 dark:hover:text-zinc-200"}`}>
                        {style}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default PageStyle