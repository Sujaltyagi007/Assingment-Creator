import { GlobalSettings } from '@/lib/types'
import React from 'react'

type Props = {
    onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
    settings: GlobalSettings;
}

const PageStyle = ({ onUpdateSettings, settings }: Props) => {
    return (
        <div className="rounded-xl bg-[#14141d] border border-[#232332] p-3 flex flex-col gap-2">
            <span className="font-bold text-primary text-[11px] uppercase tracking-wider flex items-center gap-1">
                🗒️ PAGE STYLE
            </span>
            <div className="grid grid-cols-3 gap-2">
                {(["ruled", "blank", "graph"] as const).map((style) => (
                    <button key={style} type="button" onClick={() => onUpdateSettings({ paperStyle: style })}
                        className={`rounded-lg py-2 text-xs font-semibold capitalize border transition-colors ${settings.paperStyle === style ? "bg-primary/10 border-primary text-primary" : "bg-[#0b0b10] border-[#272738] text-zinc-400 hover:text-zinc-200"}`}>
                        {style}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default PageStyle