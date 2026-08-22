import { useState, useRef } from "react";

export function useFormatText(baseFontSize: number = 20) {
    const [hasSelection, setHasSelection] = useState(false);
    const textareaRef = useRef<HTMLElement | null>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false, italic: false, underline: false,
        strikethrough: false, highlight: false, center: false,
        alignLeft: false, alignRight: false,
        superscript: false, subscript: false,
    });

    const checkFormat = (checkNode: (el: HTMLElement) => boolean): boolean => {
        if (typeof window === "undefined") return false;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;

        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

        while (node && node !== textareaRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE && checkNode(node as HTMLElement)) return true;
            node = node.parentNode;
        }
        return false;
    };

    const isSelectionCentered = () => {
        try { if (document.queryCommandState("justifyCenter")) return true; } catch { }
        return checkFormat(el => el.tagName.toLowerCase() === "center" || el.style.textAlign === "center" || el.getAttribute("align") === "center");
    };

    const isSelectionRight = () => {
        try { if (document.queryCommandState("justifyRight")) return true; } catch { }
        return checkFormat(el => el.style.textAlign === "right" || el.getAttribute("align") === "right");
    };

    const isSelectionLeft = () => {
        try { if (document.queryCommandState("justifyLeft")) return true; } catch { }
        return checkFormat(el => el.style.textAlign === "left" || el.getAttribute("align") === "left");
    };

    const isSelectionHighlighted = () => {
        return checkFormat(el => {
            const bg = el.style.backgroundColor || el.style.background || el.getAttribute("bgcolor");
            return el.tagName.toLowerCase() === "mark" || (!!bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "none");
        });
    };

    const updateActiveFormats = () => {
        if (typeof document === "undefined") return;
        const centered = isSelectionCentered();
        const right = isSelectionRight();
        setActiveFormats({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            strikethrough: document.queryCommandState("strikeThrough"),
            highlight: isSelectionHighlighted(),
            center: centered,
            alignLeft: !centered && !right,
            alignRight: right,
            superscript: document.queryCommandState("superscript"),
            subscript: document.queryCommandState("subscript"),
        });
    };

    const handleSelectionChange = (hasSel: boolean, start: number, end: number, element: HTMLElement) => {
        setHasSelection(hasSel);
        textareaRef.current = element;
        updateActiveFormats();
        const sel = window.getSelection();
        if (hasSel && sel && sel.rangeCount > 0) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const handleFormatText = (tag: string, value?: string) => {
        const element = textareaRef.current;
        if (!element) return;

        element.focus();
        const sel = window.getSelection();
        if (savedRangeRef.current && sel) {
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
        }

        const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

        switch (tag) {
            case "b": exec("bold"); break;
            case "i": exec("italic"); break;
            case "u": exec("underline"); break;
            case "s": exec("strikeThrough"); break;
            case "sup": exec("superscript"); break;
            case "sub": exec("subscript"); break;
            case "center": exec(isSelectionCentered() ? "justifyLeft" : "justifyCenter"); break;
            case "align-left": exec("justifyLeft"); break;
            case "align-right": exec("justifyRight"); break;
            case "h": const color = isSelectionHighlighted() ? "transparent" : "#fef08a";
                try { exec("hiliteColor", color); } catch { exec("backColor", color); }
                break;
            case "color":
                exec("foreColor", value);
                if (sel && sel.rangeCount > 0) {
                    Array.from(element.querySelectorAll('.math-frac')).forEach(frac => {
                        if (sel.containsNode(frac, true)) {
                            (frac as HTMLElement).style.color = value!;
                        }
                    });
                }
                break;
            case "frac":
                if (value) {
                    const [num, den] = value.split("/");
                    const html = `<span class="math-frac" contenteditable="false" style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; margin: 0 4px; line-height: 1;"><span class="math-num" style="border-bottom: 1px solid currentColor; padding: 0 2px;">${num}</span><span class="math-den" style="padding: 0 2px;">${den}</span></span>&#8203;`;
                    exec("insertHTML", html);
                }
                break;
            case "size":
            case "size-inc":
            case "size-dec":
                if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) break;

                let targetSize = value ? parseInt(value, 10) : 18;
                if (!value) {
                    const container = sel.getRangeAt(0).commonAncestorContainer;
                    let parentEl = container.nodeType === Node.ELEMENT_NODE ? container as HTMLElement : container.parentElement;
                    let currentSize = baseFontSize;

                    while (parentEl && parentEl !== element) {
                        const dataSize = parentEl.getAttribute("data-size");
                        if (dataSize) { currentSize = parseInt(dataSize, 10); break; }
                        if (parentEl.style.fontSize) {
                            const uiSize = parseInt(parentEl.style.fontSize, 10);
                            if (!isNaN(uiSize)) { currentSize = Math.round(uiSize * (baseFontSize / 14)); break; }
                        }
                        parentEl = parentEl.parentElement;
                    }

                    targetSize = tag === "size-inc" ? Math.min(64, currentSize + 2) : Math.max(12, currentSize - 2);
                }

                exec("styleWithCSS", "false");
                exec("fontSize", "7");

                const uiSize = Math.round(targetSize * (14 / baseFontSize));
                element.querySelectorAll('font[size="7"], span[style*="xxx-large"], span[style*="7"]').forEach((el) => {
                    el.removeAttribute("size");
                    (el as HTMLElement).style.fontSize = `${uiSize}px`;
                    el.setAttribute("data-size", targetSize.toString());
                    el.querySelectorAll("*").forEach(desc => {
                        if (desc instanceof HTMLElement && desc.style.fontSize) {
                            desc.style.fontSize = "";
                            desc.removeAttribute("data-size");
                            if (!desc.getAttribute("style")) desc.removeAttribute("style");
                        }
                    });
                });

                Array.from(element.querySelectorAll('.math-frac')).forEach(frac => {
                    if (sel.containsNode(frac, true)) {
                        (frac as HTMLElement).style.fontSize = `${uiSize}px`;
                        frac.setAttribute("data-size", targetSize.toString());
                    }
                });

                exec("styleWithCSS", "true");
                break;
        }

        element.dispatchEvent(new Event("input", { bubbles: true }));
        updateActiveFormats();
    };

    return { hasSelection, activeFormats, handleSelectionChange, handleFormatText, textareaRef };
}
