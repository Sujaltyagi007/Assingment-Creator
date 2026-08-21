import React, { useRef } from 'react';

type SaveLoadCardProps = {
  onSaveDocument?: () => void;
  onLoadDocument?: (file: File) => void;
};

export const SaveLoadCard = ({ onSaveDocument, onLoadDocument }: SaveLoadCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLoadDocument) {
      onLoadDocument(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#14141d] dark:border-[#232332] p-3 flex flex-col gap-3 transition-colors duration-200">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold text-primary text-xs">Save & Load Project</h3>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Save your work as a file and load it later on any device.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSaveDocument}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-[#1f1f28] dark:hover:bg-[#2a2a35] dark:border-[#2a2a35] dark:text-zinc-300 rounded-lg transition-colors text-[11px] font-semibold cursor-pointer shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          Save
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-[#1f1f28] dark:hover:bg-[#2a2a35] dark:border-[#2a2a35] dark:text-zinc-300 rounded-lg transition-colors text-[11px] font-semibold cursor-pointer shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Load
        </button>
        <input
          type="file"
          accept=".wbh,.json"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
