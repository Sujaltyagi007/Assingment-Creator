import { RealismSettings } from "@/lib/types";

type Props = {
    onUpdateRealism: (realism: Partial<RealismSettings>) => void;
    randomizeSeed: () => void;
    settings: RealismSettings;
}

export const HandWritingStyling = ({ onUpdateRealism, randomizeSeed, settings }: Props) => {
    return (
        <div className="rounded-xl bg-[#14141d] border border-[#232332] p-3 flex flex-col gap-3">
            <span className="font-bold text-zinc-400 text-[11px] uppercase tracking-wider">
                HANDWRITING NUANCES
            </span>

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-zinc-300">Hand Mode (Slant)</span>
                    <span className="bg-[#1f1f2e] border border-zinc-700/60 rounded px-1.5 py-0.5 text-zinc-400">Left / Right</span>
                </div>
                <input type="range" min={-10} max={10} value={settings.slant}
                    onChange={(e) => onUpdateRealism({ slant: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>

            <div className="flex flex-col gap-1">
                <span className="font-semibold text-zinc-300 text-[10px]">Ink Pressure</span>
                <input type="range" min={0.01} max={0.5} step={0.01} value={settings.pressureVariance}
                    onChange={(e) => onUpdateRealism({ pressureVariance: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-zinc-300">Variation Seed</span>
                    <button type="button" onClick={randomizeSeed} className="bg-[#1f1f2e] border border-zinc-700/60 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded px-1.5 py-0.5 transition-colors"                    >
                        Change Style
                    </button>
                </div>
                <input type="range" min={1} max={100} value={settings.seed}
                    onChange={(e) => onUpdateRealism({ seed: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>
        </div>
    )
}