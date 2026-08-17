"use client";

type Props = {
    hasSelection: boolean;
    onFormatText: (tag: string, value?: string) => void;
    onAddImage?: (src: string, width: number, height: number) => void;
    activeFormats?: {
        bold: boolean;
        italic: boolean;
        underline: boolean;
        strikethrough: boolean;
        highlight: boolean;
    };
};

export const WriteTab = ({ hasSelection, onFormatText, onAddImage, activeFormats = { bold: false, italic: false, underline: false, strikethrough: false, highlight: false } }: Props) => {
    return (
        <div className="flex items-center gap-2.5 rounded-full bg-zinc-100 border border-zinc-200 shadow-sm dark:bg-[#16161e] dark:border-[#272734] px-2 py-1 dark:shadow-md min-h-12 w-full transition-all duration-300">
            <div className="flex items-center gap-2 shrink-0">
                <button type="button" title="Blue Ink" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("color", "#2563eb")} className="size-10 rounded-full bg-[#2563eb] transition-transform hover:scale-103 active:scale-95 cursor-pointer border border-zinc-300 dark:border-zinc-700/60 shadow-sm" />
                <button type="button" title="Black Ink" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("color", "#000000")} className="size-10 rounded-full bg-black border border-zinc-300 dark:border-zinc-700/60 transition-transform hover:scale-103 active:scale-95 cursor-pointer shadow-sm" />
                <button type="button" title="Red Ink" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("color", "#dc2626")} className="size-10 rounded-full bg-[#dc2626] transition-transform hover:scale-103 active:scale-95 cursor-pointer border border-zinc-300 dark:border-zinc-700/60 shadow-sm" />
            </div>

            <div className={`flex items-center ml-auto gap-2 transition-all duration-300 ease-in-out overflow-hidden ${hasSelection ? "max-w-md opacity-100 pr-2" : "max-w-0 opacity-0 pointer-events-none"}`}>
                <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700/60 shrink-0 mr-1" />
                <div className="flex items-center gap-3.5 text-zinc-600 dark:text-zinc-400 text-[13px] font-serif shrink-0">
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("b")} className={`font-bold hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer text-sm ${activeFormats.bold ? "text-primary scale-110" : ""}`} title="Bold">
                        B
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("i")} className={`italic hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer text-sm ${activeFormats.italic ? "text-primary scale-110" : ""}`} title="Italic">
                        I
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("u")} className={`underline hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer text-sm ${activeFormats.underline ? "text-primary scale-110" : ""}`} title="Underline">
                        U
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("h")} className={`hover:text-primary transition-colors cursor-pointer ${activeFormats.highlight ? "text-primary scale-110" : ""}`} title="Highlight">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5zM3 20h18v2H3v-2z" />
                        </svg>
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("s")} className={`hover:text-zinc-900 dark:hover:text-white transition-colors line-through font-sans text-xs cursor-pointer ${activeFormats.strikethrough ? "text-primary scale-110" : ""}`} title="Strikethrough">
                        S
                    </button>
                </div>
            </div>
        </div>
    );
};