import { useState, useRef } from "react";

export function useFormatText() {
    const [hasSelection, setHasSelection] = useState(false);
    const textareaRef = useRef<HTMLElement | null>(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        highlight: false,
    });

    const isSelectionHighlighted = (): boolean => {
        if (typeof window === "undefined") return false;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;

        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
        if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
        }

        while (node && node !== textareaRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const bg = el.style.backgroundColor || el.style.background || el.getAttribute("bgcolor");
                if (
                    el.tagName.toLowerCase() === "mark" ||
                    (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "none")
                ) {
                    return true;
                }
            }
            node = node.parentNode;
        }
        return false;
    };

    const updateActiveFormats = () => {
        if (typeof document === "undefined") return;
        setActiveFormats({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            strikethrough: document.queryCommandState("strikeThrough"),
            highlight: isSelectionHighlighted(),
        });
    };

    const handleSelectionChange = (hasSel: boolean, start: number, end: number, element: HTMLElement) => {
        setHasSelection(hasSel);
        textareaRef.current = element;
        updateActiveFormats();
    };

    const handleFormatText = (tag: string, value?: string) => {
        const element = textareaRef.current;
        if (!element) return;

        element.focus();

        if (tag === "b") {
            document.execCommand("bold", false);
        } else if (tag === "i") {
            document.execCommand("italic", false);
        } else if (tag === "u") {
            document.execCommand("underline", false);
        } else if (tag === "s") {
            document.execCommand("strikeThrough", false);
        } else if (tag === "h") {
            const isCurrentlyHighlighted = isSelectionHighlighted();
            if (isCurrentlyHighlighted) {
                try {
                    document.execCommand("hiliteColor", false, "transparent");
                } catch {
                    document.execCommand("backColor", false, "transparent");
                }
            } else {
                try {
                    document.execCommand("hiliteColor", false, "#fef08a");
                } catch {
                    document.execCommand("backColor", false, "#fef08a");
                }
            }
        } else if (tag === "color") {
            document.execCommand("foreColor", false, value);
        }

        // Trigger input event to update React state
        const event = new Event("input", { bubbles: true });
        element.dispatchEvent(event);
        updateActiveFormats();
    };

    return {
        hasSelection,
        activeFormats,
        handleSelectionChange,
        handleFormatText,
        textareaRef,
    };
}
