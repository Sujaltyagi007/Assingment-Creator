import React, { useRef, useEffect } from "react";

export interface HomeTextAreaProps {
    content: string;
    onContentChange: (content: string) => void;
    autoCorrect?: boolean;
    onSelectionChange?: (hasSelection: boolean, selectionStart: number, selectionEnd: number, element: HTMLElement) => void;
    onAddImage?: (src: string, width: number, height: number) => void;
}

function bbcodeToHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\[b\]/g, "<strong>")
        .replace(/\[\/b\]/g, "</strong>")
        .replace(/\[i\]/g, "<em>")
        .replace(/\[\/i\]/g, "</em>")
        .replace(/\[u\]/g, "<u>")
        .replace(/\[\/u\]/g, "</u>")
        .replace(/\[h\]/g, '<span style="background-color: #fef08a; color: #000000;">')
        .replace(/\[\/h\]/g, "</span>")
        .replace(/\[s\]/g, "<s>")
        .replace(/\[\/s\]/g, "</s>")
        .replace(/\[color=([^\]]+)\]/g, '<span style="color: $1">')
        .replace(/\[\/color\]/g, "</span>")
        .replace(/\n/g, "<br>");
}

function htmlToBbcode(html: string): string {
    if (typeof document === "undefined") return html;
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const parseNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || "";
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            let text = "";
            el.childNodes.forEach((child) => {
                text += parseNode(child);
            });

            const tag = el.tagName.toLowerCase();
            if (tag === "strong" || tag === "b") return `[b]${text}[/b]`;
            if (tag === "em" || tag === "i") return `[i]${text}[/i]`;
            if (tag === "u") return `[u]${text}[/u]`;
            if (tag === "mark" || (tag === "span" && el.style.backgroundColor && el.style.backgroundColor !== "transparent" && el.style.backgroundColor !== "rgba(0, 0, 0, 0)")) return `[h]${text}[/h]`;
            if (tag === "s" || tag === "strike" || tag === "del") return `[s]${text}[/s]`;
            if (tag === "span" && el.style.color) {
                return `[color=${el.style.color}]${text}[/color]`;
            }
            if (tag === "br") return "\n";
            if (tag === "div" || tag === "p") {
                return (text ? "\n" + text : "");
            }
            return text;
        }
        return "";
    };

    let bbcode = "";
    temp.childNodes.forEach((child) => {
        bbcode += parseNode(child);
    });

    return bbcode.replace(/^\n/, "");
}

export const HomeTextArea = ({ content, onContentChange, autoCorrect, onSelectionChange, onAddImage }: HomeTextAreaProps) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (editableRef.current) {
            const currentHtml = editableRef.current.innerHTML;
            const expectedHtml = bbcodeToHtml(content);
            if (htmlToBbcode(currentHtml) !== content) {
                editableRef.current.innerHTML = expectedHtml;
            }
        }
    }, [content]);

    const handleInput = () => {
        if (editableRef.current) {
            const html = editableRef.current.innerHTML;
            const bbcode = htmlToBbcode(html);
            onContentChange(bbcode);
        }
    };

    const handleSelect = () => {
        const selection = window.getSelection();
        const hasSel = !!selection && selection.toString().length > 0;
        onSelectionChange?.(hasSel, 0, 0, editableRef.current!);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onAddImage) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            onAddImage(result, 150, 150);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <div className="flex-1 flex flex-col rounded-2xl bg-[#13131a] border border-[#232330] h-full p-4 shadow-inner min-h-87.5 relative pb-12 ">
            <div ref={editableRef} contentEditable
                onInput={handleInput}
                onSelect={handleSelect}
                onKeyUp={handleSelect}
                onMouseUp={handleSelect}
                spellCheck={autoCorrect}
                className="w-full flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none font-sans text-base leading-relaxed overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none" style={{ minHeight: "150px" }}
            />

            <div className="absolute bottom-3 left-4 flex items-center">
                <input
                    type="file"
                    accept=".svg"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button
                    type="button"
                    title="Upload SVG Image"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/50 text-zinc-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Import SVG
                </button>
            </div>
        </div>
    );
};