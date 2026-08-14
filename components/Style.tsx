import PageStyle from './StyleTab/PageStyle';
import { MarginCard } from './StyleTab/MarginCard';
import TypographyCard from './StyleTab/TypographyCard';
import { FontSelection } from './StyleTab/FontSelection';
import { GlobalSettings, RealismSettings } from '@/lib/types'
import { HandWritingStyling } from './StyleTab/HandWritingStyling';

type StyleProps = {
    onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
    onUpdateRealism: (realism: Partial<RealismSettings>) => void;
    randomizeSeed: () => void;
    applyPreset: (preset: "standard" | "cbse") => void;
    settings: GlobalSettings;
}

export const Style = ({ onUpdateRealism, onUpdateSettings, randomizeSeed, applyPreset, settings }: StyleProps) => {
    return (
        <div className="flex flex-col gap-4 text-xs ">
            <FontSelection onUpdateSettings={onUpdateSettings} settings={settings} />
            <PageStyle onUpdateSettings={onUpdateSettings} settings={settings} />
            <HandWritingStyling onUpdateRealism={onUpdateRealism} randomizeSeed={randomizeSeed} settings={settings.realism} />
            <TypographyCard onUpdateSettings={onUpdateSettings} settings={settings} />
            <MarginCard settings={settings} onUpdateSettings={onUpdateSettings} applyPreset={applyPreset} />
        </div>
    );
};