import { GlobalSettings } from '@/lib/types';
import HeadingIcon from '@/public/Icons/Loading.svg'

type Props = {
  settings: GlobalSettings;
  onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
};

export const HeaderFooterCard = ({ settings, onUpdateSettings }: Props) => {
  return (
    <div className="rounded-xl bg-[#14141d] border border-[#232332] p-3 flex flex-col  gap-2.5">
      <div className='flex items-center transform -translate-x-2'>
        <img src={HeadingIcon.src} alt='HeadingIcon' className='w-12 h-full' />
        <h2 className=' transform -translate-x-2 text-xs font-bold tracking-wider text-primary uppercase'> HEADER & FOOTER</h2>
      </div>
      <div className=" space-y-2 mx-auto w-full flex flex-col ">
        <input type="text" placeholder="Header Left" value={settings.headerLeft}
          onChange={(e) => onUpdateSettings({ headerLeft: e.target.value })}
          className="rounded-lg bg-[#0b0b10] border border-[#272738] px-2.5 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary"
        />
        <input type="text" placeholder="Header Right" value={settings.headerRight}
          onChange={(e) => onUpdateSettings({ headerRight: e.target.value })}
          className="rounded-lg bg-[#0b0b10] border border-[#272738] px-2.5 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary"
        />
        <input type="text" placeholder="Watermark Text (e.g. Confidential)" value={settings.watermarkText}
          onChange={(e) => onUpdateSettings({ watermarkText: e.target.value })}
          className="rounded-lg bg-[#0b0b10] border border-[#272738] px-2.5 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
};
