import React, { useRef, useEffect, useCallback, useState } from "react";

declare global {
    interface Window {
        find(
            aString: string,
            aCaseSensitive?: boolean,
            aBackwards?: boolean,
            aWrapAround?: boolean,
            aWholeWord?: boolean,
            aSearchInFrames?: boolean,
            aShowDialog?: boolean
        ): boolean;
    }
}

export interface HomeTextAreaProps {
    content: string;
    onContentChange: (content: string) => void;
    autoCorrect?: boolean;
    onSelectionChange?: (hasSelection: boolean, selectionStart: number, selectionEnd: number, element: HTMLElement) => void;
    onAddImage?: (src: string, width: number, height: number) => void;
    onFormatText?: (tag: string, value?: string) => void;
    baseFontSize?: number;
    fontFamily?: string;
}

function bbcodeToHtml(text: string, baseFontSize: number = 28): string {
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div style="text-align: center;">$1</div>')
        .replace(/\[b\]/g, "<strong>").replace(/\[\/b\]/g, "</strong>")
        .replace(/\[i\]/g, "<em>").replace(/\[\/i\]/g, "</em>")
        .replace(/\[u\]/g, "<u>").replace(/\[\/u\]/g, "</u>")
        .replace(/\[h\]/g, '<mark style="background-color: #fef08a; color: #000000; border-radius: 2px; padding: 0 2px;">')
        .replace(/\[\/h\]/g, "</mark>").replace(/\[s\]/g, "<s>")
        .replace(/\[\/s\]/g, "</s>")
        .replace(/\[sup\]/g, "<sup>").replace(/\[\/sup\]/g, "</sup>")
        .replace(/\[sub\]/g, "<sub>").replace(/\[\/sub\]/g, "</sub>")
        .replace(/\[size=([^\]]+)\]/g, (sizeStr) => {
            const canvasSize = parseInt(sizeStr, 10);
            const uiSize = Math.round(canvasSize * (14 / baseFontSize));
            return `<span style="font-size: ${uiSize}px;" data-size="${canvasSize}">`;
        })
        .replace(/\[\/size\]/g, "</span>")
        .replace(/\[color=([^\]]+)\]/g, '<span style="color: $1">')
        .replace(/\[\/color\]/g, "</span>");

    html = html.replace(/\n/g, "<br>");
    html = html.replace(/<br>(?=<div)/gi, "");
    html = html.replace(/<\/div><br>/gi, "</div>");
    return html;
}

const BLOCK_TAGS = ["div", "p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol"];

const isFormattingBoundary = (n: Node | null): boolean => {
    if (!n) return true;
    if (n.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = (n as HTMLElement).tagName.toLowerCase();
    return tag === "br" || BLOCK_TAGS.includes(tag);
};

function htmlToBbcode(html: string, baseFontSize: number = 28): string {
    if (typeof document === "undefined") return html;
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const parseNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
            let raw = node.textContent || "";
            // Replace unicode superscripts (often created by OS autocorrect for ^2) with BBCode sup tags
            // so they use the handwritten font instead of falling back to system fonts (which look uneven).
            const supMap: Record<string, string> = {
                '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
                '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n'
            };
            for (const [uni, normal] of Object.entries(supMap)) {
                raw = raw.split(uni).join(`[sup]${normal}[/sup]`);
            }

            if (!raw.includes("\n")) return raw;
            const collapsed = raw.replace(/[ \t]*\n[ \t]*/g, " ");
            if (collapsed.trim() !== "") return collapsed;
            return isFormattingBoundary(node.previousSibling) || isFormattingBoundary(node.nextSibling) ? "" : " ";
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            let text = "";
            el.childNodes.forEach(child => { text += parseNode(child); });
            const tag = el.tagName.toLowerCase();
            const bg = el.style.backgroundColor || el.style.background || el.getAttribute("bgcolor");
            const hasBg = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "none";
            const textColor = el.style.color || el.getAttribute("color");

            let sizeVal: string | null = el.getAttribute("data-size");
            if (!sizeVal) {
                const fontSize = el.style.fontSize;
                if (fontSize) {
                    const match = fontSize.match(/^(\d+)(px)?$/);
                    if (match) {
                        const uiSize = parseInt(match[1], 10);
                        sizeVal = Math.round(uiSize * (baseFontSize / 14)).toString();
                    }
                }
            }

            const isCenter = tag === "center" || el.style.textAlign === "center" || el.getAttribute("align") === "center";

            let fText = text;
            if (tag === "strong" || tag === "b" || el.style.fontWeight === "bold" || parseInt(el.style.fontWeight, 10) >= 700) fText = `[b]${fText}[/b]`;
            if (tag === "em" || tag === "i" || el.style.fontStyle === "italic") fText = `[i]${fText}[/i]`;
            if (tag === "u" || el.style.textDecoration?.includes("underline") || el.style.textDecorationLine?.includes("underline")) fText = `[u]${fText}[/u]`;
            if (tag === "s" || tag === "strike" || tag === "del" || el.style.textDecoration?.includes("line-through") || el.style.textDecorationLine?.includes("line-through")) fText = `[s]${fText}[/s]`;
            if (tag === "sup") fText = `[sup]${fText}[/sup]`;
            if (tag === "sub") fText = `[sub]${fText}[/sub]`;
            if (tag === "mark" || hasBg) fText = `[h]${fText}[/h]`;
            if (textColor && !hasBg) fText = `[color=${textColor}]${fText}[/color]`;
            if (sizeVal) fText = `[size=${sizeVal}]${fText}[/size]`;
            if (isCenter && fText.trim()) fText = `[center]${fText}[/center]`;
            if (tag === "br") return "\n";

            const isBlock = BLOCK_TAGS.includes(tag);
            if (isBlock) {
                fText = fText.replace(/\n$/, "");
                if (fText.startsWith("\n")) return fText;
                return fText ? "\n" + fText : "\n";
            }
            return fText;
        }
        return "";
    };

    let bbcode = "";
    temp.childNodes.forEach(child => { bbcode += parseNode(child); });
    return bbcode.replace(/^(?:[ \t]*\n)+/, "");
}

export const HomeTextArea = ({ content, onContentChange, autoCorrect, onSelectionChange, onAddImage, onFormatText, baseFontSize = 28, fontFamily }: HomeTextAreaProps) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastEmittedRef = useRef<string | null>(null);
    useEffect(() => { lastEmittedRef.current = null; }, [baseFontSize]);
    useEffect(() => {
        if (editableRef.current && content !== lastEmittedRef.current) {
            const currentHtml = editableRef.current.innerHTML;
            const expectedHtml = bbcodeToHtml(content, baseFontSize);
            if (htmlToBbcode(currentHtml, baseFontSize) !== content) { editableRef.current.innerHTML = expectedHtml; }
        }
    }, [content, baseFontSize]);

    const handleInput = useCallback(() => {
        if (editableRef.current) {
            const bbcode = htmlToBbcode(editableRef.current.innerHTML, baseFontSize);
            lastEmittedRef.current = bbcode;
            onContentChange(bbcode);
        }
    }, [onContentChange, baseFontSize]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();

        // 1. Check for Images (e.g., Snipping Tool copies of equations)
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            for (let i = 0; i < e.clipboardData.files.length; i++) {
                const file = e.clipboardData.files[i];
                if (file.type.startsWith("image/") && onAddImage) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const result = event.target?.result as string;
                        // Add image to canvas (default size 200x200, user can resize)
                        onAddImage(result, 200, 200);
                    };
                    reader.readAsDataURL(file);
                    return; // Stop processing since we handled an image
                }
            }
        }

        const html = e.clipboardData.getData("text/html");
        const plainText = e.clipboardData.getData("text/plain");

        // Helper to convert LaTeX-like math symbols to Unicode
        const convertMathSymbols = (text: string) => {
            const symbols: Record<string, string> = {
                '\\theta': 'θ', '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\pi': 'π',
                '\\Sigma': 'Σ', '\\sigma': 'σ', '\\Omega': 'Ω', '\\omega': 'ω', '\\mu': 'μ', '\\lambda': 'λ',
                '\\infty': '∞', '\\int': '∫', '\\sqrt': '√', '\\approx': '≈', '\\neq': '≠', '\\leq': '≤',
                '\\geq': '≥', '\\pm': '±', '\\times': '×', '\\div': '÷', '\\cdot': '⋅', '\\circ': '∘'
            };
            let result = text;
            for (const [latex, unicode] of Object.entries(symbols)) {
                // Replace all occurrences of the latex command
                result = result.split(latex).join(unicode);
            }
            return result;
        };

        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const unwantedTags = ['script', 'style', 'meta', 'svg', 'iframe', 'form', 'img', 'noscript', 'link', 'object', 'applet', 'nav', 'footer', 'header', 'aside'];
            unwantedTags.forEach(tag => { doc.querySelectorAll(tag).forEach(el => el.remove()); });

            const cleanNode = (node: Node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as HTMLElement;
                    const tag = el.tagName.toLowerCase();
                    const fw = el.style.fontWeight;
                    const fs = el.style.fontStyle;
                    const td = el.style.textDecoration;
                    const ds = el.getAttribute("data-size");
                    let replacement: HTMLElement | null = null;
                    if (tag.match(/^h[1-6]$/)) {
                        const level = parseInt(tag[1]);
                        const size = Math.max(16, Math.round(48 - ((level - 1) * 5)));
                        replacement = document.createElement('div');
                        replacement.setAttribute("data-size", size.toString());
                        replacement.innerHTML = el.innerHTML;
                    }
                    // Map lists to text bullets — use <span> (inline) so prefix + content
                    // stays on one line; the outer <ul>/<ol>→<div> provides the block break.
                    else if (tag === 'li') {
                        const isOrdered = el.closest('ol') !== null;
                        const index = isOrdered ? Array.from(el.parentNode?.children || []).indexOf(el) + 1 : null;
                        replacement = document.createElement('span');
                        const prefix = isOrdered ? `${index}. ` : `• `;
                        replacement.innerHTML = prefix + el.innerHTML.trim();
                    }
                    // Flatten tables
                    else if (tag === 'table') {
                        replacement = document.createElement('div');
                        const tableText = Array.from(el.querySelectorAll('tr')).map(tr => {
                            return Array.from(tr.querySelectorAll('td, th')).map(td => td.textContent?.trim() || "").join(" | ");
                        }).join("<br/>");
                        replacement.innerHTML = tableText;
                    }
                    else if (tag === 'a' || tag === 'b' || tag === 'strong') {
                        replacement = document.createElement('span');
                        replacement.innerHTML = el.innerHTML;
                    }

                    const target = replacement || el;
                    if (replacement) { el.replaceWith(replacement); }
                    Array.from(target.attributes).forEach(attr => { target.removeAttribute(attr.name); });
                    if (ds || replacement?.getAttribute("data-size")) { target.setAttribute("data-size", ds || replacement!.getAttribute("data-size")!); }
                    if (fs === 'italic' || tag === 'i' || tag === 'em') { target.style.fontStyle = 'italic'; }
                    if (td.includes('line-through') || tag === 's' || tag === 'strike' || tag === 'del') { target.style.textDecoration = 'line-through'; }
                    if (td.includes('underline') || tag === 'u') { target.style.textDecoration = 'underline'; }

                    Array.from(target.childNodes).forEach(cleanNode);
                }
            };

            Array.from(doc.body.childNodes).forEach(cleanNode);

            doc.querySelectorAll('ul, ol').forEach(el => {
                const newEl = document.createElement('div');
                // Each <li> was replaced with a <span>; join them with <br> so each
                // list item lands on its own line in the output.
                const items = Array.from(el.querySelectorAll('span'));
                if (items.length > 0) {
                    newEl.innerHTML = items.map(s => s.outerHTML).join('<br>');
                } else {
                    newEl.innerHTML = el.innerHTML;
                }
                el.replaceWith(newEl);
            });

            // Convert LaTeX/math expressions into Unicode text
            const finalHtml = convertMathSymbols(doc.body.innerHTML);
            document.execCommand("insertHTML", false, finalHtml);
        } else if (plainText) {
            // Normalize plain text: limit sequential newlines, remove invisible chars
            let normalizedText = plainText
                .replace(/\r\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/[\t ]+$/gm, '')
                .replace(/[\u200B-\u200D\uFEFF]/g, '');

            // Convert LaTeX/math expressions into Unicode text
            normalizedText = convertMathSymbols(normalizedText);

            document.execCommand("insertText", false, normalizedText);
        }
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!onFormatText) return;

        // Ctrl+Shift+> or Ctrl+Shift+.
        if (e.ctrlKey && e.shiftKey && (e.key === ">" || e.key === ".")) {
            e.preventDefault();
            onFormatText("size-inc");
        }
        // Ctrl+Shift+< or Ctrl+Shift+,
        else if (e.ctrlKey && e.shiftKey && (e.key === "<" || e.key === ",")) {
            e.preventDefault();
            onFormatText("size-dec");
        }
        // Ctrl+Shift++ (Ctrl and Plus key)
        else if (e.ctrlKey && e.shiftKey && (e.key === "+" || e.key === "=")) {
            e.preventDefault();
            onFormatText("size-inc");
        }
        // Ctrl+- (Ctrl and Minus key)
        else if (e.ctrlKey && e.key === "-") {
            e.preventDefault();
            onFormatText("size-dec");
        }
        else if (e.ctrlKey && (e.key === "f" || e.key === "h")) {
            e.preventDefault();
            setShowFindReplace(true);
        }
    }, [onFormatText]);

    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState("");
    const [replaceText, setReplaceText] = useState("");

    const getEditorTextMapping = () => {
        const root = editableRef.current;
        if (!root) return null;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let node;
        let text = "";
        const mapping: { node: Node; offset: number }[] = [];
        while ((node = walker.nextNode())) {
            const val = node.nodeValue || "";
            for (let i = 0; i < val.length; i++) {
                mapping.push({ node, offset: i });
            }
            text += val;
        }
        return { text, mapping };
    };

    const handleFind = () => {
        if (!findText || !editableRef.current) return;
        
        let startIndex = 0;
        const sel = window.getSelection();
        const mapData = getEditorTextMapping();
        if (!mapData || mapData.mapping.length === 0) return;
        const { text, mapping } = mapData;
        
        if (sel && sel.rangeCount > 0 && editableRef.current.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            const index = mapping.findIndex(m => m.node === range.endContainer && m.offset === range.endOffset);
            if (index !== -1) startIndex = index;
        }
        
        let matchIndex = text.toLowerCase().indexOf(findText.toLowerCase(), startIndex);
        if (matchIndex === -1 && startIndex > 0) {
            matchIndex = text.toLowerCase().indexOf(findText.toLowerCase(), 0);
        }
        
        if (matchIndex !== -1) {
            const startMap = mapping[matchIndex];
            const endMap = matchIndex + findText.length < mapping.length 
                ? mapping[matchIndex + findText.length] 
                : { node: mapping[mapping.length-1].node, offset: mapping[mapping.length-1].node.nodeValue!.length };
            
            const newRange = document.createRange();
            newRange.setStart(startMap.node, startMap.offset);
            newRange.setEnd(endMap.node, endMap.offset);
            
            sel?.removeAllRanges();
            sel?.addRange(newRange);
            
            if (startMap.node.parentElement) {
                startMap.node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const handleReplace = () => {
        if (!findText || !editableRef.current) return;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const selText = sel.toString();
            if (selText.toLowerCase() === findText.toLowerCase() && editableRef.current.contains(sel.anchorNode)) {
                document.execCommand("insertText", false, replaceText);
                editableRef.current.dispatchEvent(new Event("input", { bubbles: true }));
            }
        }
        handleFind();
    };

    const handleReplaceAll = () => {
        if (!findText || !editableRef.current) return;
        let count = 0;
        let mapData = getEditorTextMapping();
        
        while (mapData && mapData.mapping.length > 0) {
            const { text, mapping } = mapData;
            const matchIndex = text.toLowerCase().indexOf(findText.toLowerCase());
            if (matchIndex === -1) break;
            
            const startMap = mapping[matchIndex];
            const endMap = matchIndex + findText.length < mapping.length 
                ? mapping[matchIndex + findText.length] 
                : { node: mapping[mapping.length-1].node, offset: mapping[mapping.length-1].node.nodeValue!.length };
                
            const newRange = document.createRange();
            newRange.setStart(startMap.node, startMap.offset);
            newRange.setEnd(endMap.node, endMap.offset);
            
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(newRange);
            
            document.execCommand("insertText", false, replaceText);
            count++;
            
            mapData = getEditorTextMapping();
        }
        
        if (count > 0) {
            editableRef.current.dispatchEvent(new Event("input", { bubbles: true }));
        }
    };

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
            <div ref={editableRef} contentEditable onInput={handleInput} onPaste={handlePaste} onKeyDown={handleKeyDown}
                onSelect={handleSelect} onKeyUp={handleSelect} onMouseUp={handleSelect} onTouchEnd={handleSelect}
                spellCheck={autoCorrect} className="w-full flex-1 bg-transparent text-zinc-900 placeholder-zinc-400 dark:text-zinc-100 dark:placeholder-zinc-600 focus:outline-none resize-none font-sans text-sm leading-relaxed overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none [&>div]:m-0 [&>div[style*='text-align: center']]:m-0" style={{ minHeight: "150px" }}
            />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <input type="file" accept=".svg" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button type="button" title="Upload SVG Image" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200/80 hover:bg-zinc-300 border border-zinc-300 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/80 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    Import SVG
                </button>
                <button type="button" title="Find and Replace" onClick={() => setShowFindReplace(prev => !prev)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold cursor-pointer shadow-sm ${showFindReplace ? 'bg-[#FF5533] text-white border-[#FF5533]' : 'bg-zinc-200/80 hover:bg-zinc-300 border-zinc-300 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/80 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    Find & Replace
                </button>
            </div>

            {showFindReplace && (
                <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg p-3 z-10 flex flex-col gap-2 w-72 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Find & Replace</span>
                        <button onClick={() => setShowFindReplace(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Find..." value={findText} onChange={e => setFindText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFind()} className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                        <button onClick={handleFind} className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded text-xs font-medium cursor-pointer">Find</button>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Replace with..." value={replaceText} onChange={e => setReplaceText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReplace()} className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={handleReplace} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium cursor-pointer">Replace</button>
                        <button onClick={handleReplaceAll} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded text-xs font-medium cursor-pointer">Replace All</button>
                    </div>
                </div>
            )}
        </div>
    );
};