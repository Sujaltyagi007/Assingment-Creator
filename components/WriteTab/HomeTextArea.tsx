import React, { useRef, useEffect, useCallback } from "react";

export interface HomeTextAreaProps {
    content: string;
    onContentChange: (content: string) => void;
    autoCorrect?: boolean;
    onSelectionChange?: (hasSelection: boolean, selectionStart: number, selectionEnd: number, element: HTMLElement) => void;
    onAddImage?: (src: string, width: number, height: number) => void;
}

function bbcodeToHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div style="text-align: center;">$1</div>')
        .replace(/\[b\]/g, "<strong>").replace(/\[\/b\]/g, "</strong>")
        .replace(/\[i\]/g, "<em>").replace(/\[\/i\]/g, "</em>")
        .replace(/\[u\]/g, "<u>").replace(/\[\/u\]/g, "</u>")
        .replace(/\[h\]/g, '<mark style="background-color: #fef08a; color: #000000; border-radius: 2px; padding: 0 2px;">')
        .replace(/\[\/h\]/g, "</mark>").replace(/\[s\]/g, "<s>")
        .replace(/\[\/s\]/g, "</s>").replace(/\[color=([^\]]+)\]/g, '<span style="color: $1">')
        .replace(/\[\/color\]/g, "</span>").replace(/\n/g, "<br>");
}

function htmlToBbcode(html: string): string {
    if (typeof document === "undefined") return html;
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const parseNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            let text = "";
            el.childNodes.forEach(child => { text += parseNode(child); });
            const tag = el.tagName.toLowerCase();
            const bg = el.style.backgroundColor || el.style.background || el.getAttribute("bgcolor");
            const hasBg = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "none";
            const textColor = el.style.color || el.getAttribute("color");
            const isCenter = tag === "center" || el.style.textAlign === "center" || el.getAttribute("align") === "center";

            let fText = text;
            if (tag === "strong" || tag === "b" || el.style.fontWeight === "bold" || parseInt(el.style.fontWeight, 10) >= 700) fText = `[b]${fText}[/b]`;
            if (tag === "em" || tag === "i" || el.style.fontStyle === "italic") fText = `[i]${fText}[/i]`;
            if (tag === "u" || el.style.textDecoration?.includes("underline") || el.style.textDecorationLine?.includes("underline")) fText = `[u]${fText}[/u]`;
            if (tag === "s" || tag === "strike" || tag === "del" || el.style.textDecoration?.includes("line-through") || el.style.textDecorationLine?.includes("line-through")) fText = `[s]${fText}[/s]`;
            if (tag === "mark" || hasBg) fText = `[h]${fText}[/h]`;
            if (textColor && !hasBg) fText = `[color=${textColor}]${fText}[/color]`;
            if (isCenter && fText.trim()) fText = `[center]${fText}[/center]`;
            if (tag === "br") return "\n";
            if (tag === "div" || tag === "p") {
                if (fText === "\n") return "\n";
                return fText ? "\n" + fText : "\n";
            }
            return fText;
        }
        return "";
    };

    let bbcode = "";
    temp.childNodes.forEach(child => { bbcode += parseNode(child); });
    return bbcode.replace(/^\n/, "");
}

export const HomeTextArea = ({ content, onContentChange, autoCorrect, onSelectionChange, onAddImage }: HomeTextAreaProps) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (editableRef.current) {
            const currentHtml = editableRef.current.innerHTML;
            const expectedHtml = bbcodeToHtml(content);
            if (htmlToBbcode(currentHtml) !== content) { editableRef.current.innerHTML = expectedHtml; }
        }
    }, [content]);

    const handleInput = useCallback(() => {
        if (editableRef.current) onContentChange(htmlToBbcode(editableRef.current.innerHTML));
    }, [onContentChange]);

    const handleSelect = useCallback(() => {
        const selection = window.getSelection();
        const hasSel = !!selection && selection.toString().length > 0;
        if (onSelectionChange && editableRef.current) {
            onSelectionChange(hasSel, 0, 0, editableRef.current);
        }
    }, [onSelectionChange]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onAddImage) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            onAddImage(result, 150, 150);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, [onAddImage]);

    return (
        <div className="flex-1 flex flex-col rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-[#13131a] dark:border-[#232330] h-full p-4 shadow-inner min-h-62.5 sm:min-h-87.5 relative pb-12 transition-colors duration-200">
            <div ref={editableRef} contentEditable
                onInput={handleInput}
                onSelect={handleSelect}
                onKeyUp={handleSelect}
                onMouseUp={handleSelect}
                onTouchEnd={handleSelect}
                spellCheck={autoCorrect}
                className="w-full flex-1 bg-transparent text-zinc-900 placeholder-zinc-400 dark:text-zinc-100 dark:placeholder-zinc-600 focus:outline-none resize-none font-sans text-base leading-relaxed overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none" style={{ minHeight: "150px" }}
            />
            <div className="absolute bottom-3 left-4 flex items-center">
                <input type="file" accept=".svg" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button type="button" title="Upload SVG Image" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200/80 hover:bg-zinc-300 border border-zinc-300 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/80 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:text-white transition-all text-xs font-semibold cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    Import SVG
                </button>
            </div>
        </div>
    );
};