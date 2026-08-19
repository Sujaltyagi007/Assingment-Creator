import { GlobalSettings } from '@/lib/types'

type Props = {
    onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
    settings: GlobalSettings;
}

export const TypographyCard = ({ onUpdateSettings, settings }: Props) => {
    return (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#14141d] dark:border-[#232332] p-3 flex flex-col gap-3 transition-colors duration-200">
            <span className="font-bold text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
                TYPOGRAPHY
            </span>
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Font Scale</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">{settings.fontSize}px</span>
                </div>
                <input type="range" min={16} max={48} value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Word Spacing</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">{settings.wordSpacing.toFixed(1)}x</span>
                </div>
                <input type="range" min={0.5} max={2.5} step={0.1}
                    value={settings.wordSpacing}
                    onChange={(e) => onUpdateSettings({ wordSpacing: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>

            {/* Line Height */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Line Height</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">{settings.lineSpacing.toFixed(1)}</span>
                </div>
                <input
                    type="range"
                    min={1.0}
                    max={3.0}
                    step={0.1}
                    value={settings.lineSpacing}
                    onChange={(e) => onUpdateSettings({ lineSpacing: Number(e.target.value) })}
                    className="modern-range"
                />
            </div>
        </div>
    )
}

export default TypographyCard