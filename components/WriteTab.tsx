"use client";
import React from "react";

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
        center: boolean;
    };
};

const nmOuter = "bg-zinc-100 dark:bg-[#16161e] shadow-[4px_4px_8px_#d4d4d8,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#0b0b0f,-4px_-4px_8px_#21212d] border-none";
const nmBtn = "bg-zinc-100 dark:bg-[#16161e] shadow-[2px_2px_4px_#d4d4d8,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_#0b0b0f,-2px_-2px_4px_#21212d] active:shadow-[inset_2px_2px_4px_#d4d4d8,inset_-2px_-2px_4px_#ffffff] dark:active:shadow-[inset_2px_2px_4px_#0b0b0f,inset_-2px_-2px_4px_#21212d] transition-shadow duration-200 border-none";
const nmBtnActive = "bg-zinc-100 dark:bg-[#16161e] shadow-[inset_2px_2px_4px_#d4d4d8,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#0b0b0f,inset_-2px_-2px_4px_#21212d] transition-shadow duration-200 border-none text-primary";

export const WriteTab = React.memo(({ hasSelection, onFormatText, onAddImage, activeFormats = { bold: false, italic: false, underline: false, strikethrough: false, highlight: false, center: false } }: Props) => {
    return (
        <div className={`relative w-full rounded-full transition-all duration-300 p-[1.5px] ${nmOuter}`}>
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none drop-shadow-[0_0_8px_#ff5533]">
                <div className="absolute -inset-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_75%,#ff5533_100%)]" />
            </div>
            
            <div className={`relative flex items-center gap-3.5 rounded-full px-3 py-[6.5px] min-h-11.25 w-full overflow-x-auto scrollbar-none bg-zinc-100 dark:bg-[#16161e]`}>
            <div className="flex items-center gap-2.5 shrink-0">
                <button type="button" title="Blue Ink" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("color", "#2563eb")} className={`size-8 flex items-center justify-center shrink-0 rounded-full cursor-pointer`}>
                    <span className="size-full rounded-full bg-[#2563eb]" />
                </button>
                <button type="button" title="Black Ink" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("color", "#000000")} className={`size-8 flex items-center justify-center shrink-0 rounded-full cursor-pointer`}>
                    <span className="size-full rounded-full bg-black" />
                </button>
                <button type="button" title="Red Ink" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("color", "#dc2626")} className={`size-8 flex items-center justify-center shrink-0 rounded-full cursor-pointer`}>
                    <span className="size-full rounded-full bg-[#dc2626]" />
                </button>
            </div>

            <div className={`flex items-center ml-auto gap-1 transition-all duration-300 ease-in-out ${hasSelection ? "max-w-md opacity-100 pr-1" : "max-w-0 opacity-0 pointer-events-none"}`}>
                <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700/60 shrink-0 mr-1 shadow-[1px_0_1px_#ffffff] dark:shadow-[1px_0_1px_#21212d]" />
                <button type="button" title="Increase Font Size" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("size-inc")} className={`w-7 h-7 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-400 cursor-pointer text-xs font-semibold shrink-0 ${nmBtn}`}                >
                    A<sup>+</sup>
                </button>
                <button type="button" title="Decrease Font Size" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("size-dec")} className={`w-7 h-7 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-400 cursor-pointer text-xs font-semibold shrink-0 ${nmBtn}`}                >
                    A<sup>-</sup>
                </button>
                <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 text-[13px] font-serif shrink-0">
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("b")} className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer font-bold text-sm ${activeFormats.bold ? nmBtnActive : nmBtn}`} title="Bold">
                        B
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("i")} className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer italic text-sm ${activeFormats.italic ? nmBtnActive : nmBtn}`} title="Italic">
                        I
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("u")} className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer underline text-sm ${activeFormats.underline ? nmBtnActive : nmBtn}`} title="Underline">
                        U
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("center")} className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer ${activeFormats.center ? nmBtnActive : nmBtn}`} title="Center Align">
                        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="10" x2="6" y2="10" />
                            <line x1="21" y1="6" x2="3" y2="6" />
                            <line x1="21" y1="14" x2="3" y2="14" />
                            <line x1="18" y1="18" x2="6" y2="18" />
                        </svg>
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("h")} className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer ${activeFormats.highlight ? nmBtnActive : nmBtn}`} title="Highlight">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5zM3 20h18v2H3v-2z" />
                        </svg>
                    </button>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => onFormatText("s")} className={`w-7 h-7 flex items-center justify-center rounded-full line-through font-sans cursor-pointer text-xs ${activeFormats.strikethrough ? nmBtnActive : nmBtn}`} title="Strikethrough">
                        S
                    </button>
                </div>
            </div>
        </div>
        </div>
    );
});