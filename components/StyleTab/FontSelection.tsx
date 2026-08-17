"use client";
import { useRef, useState } from "react";
import HandwritingIcon from "@/public/Icons/Writing.svg"
import { GlobalSettings } from "@/lib/types";
import { fontsMap, FontKey, registerCustomFont } from "@/lib/fonts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
    onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
    settings: GlobalSettings;
};

export const FontSelection = ({ onUpdateSettings, settings }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const fontName = await registerCustomFont(file);
            onUpdateSettings({ font: fontName, fontSource: "custom" });
        } catch {
            setError("Failed to load font. Make sure it's a valid .ttf / .otf / .woff file.");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const isCustom = settings.fontSource === "custom";
    const isUploaded = isCustom && !(settings.font in fontsMap);

    return (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#14141d] dark:border-[#232332] p-2 flex gap-2 transition-colors duration-200">
            <div className=" size-16 ">
                <img src={HandwritingIcon.src} alt="Handwriting" className="w-full h-full" />
            </div>
            <div className="flex flex-col items-start gap-2 mt-1 " >
                <h2 className="font-bold text-primary px-1 text-[11px] uppercase tracking-wider flex items-center gap-1" >
                    HANDWRITING FONT
                </h2>
                <Select value={isCustom ? "custom" : settings.font} onValueChange={(val) => {
                    if (val === "custom") { onUpdateSettings({ fontSource: "custom" }); }
                    else { onUpdateSettings({ font: val as FontKey, fontSource: "builtin" }) }
                }}>
                    <SelectTrigger className="w-full min-w-48 rounded-lg bg-white border border-zinc-300 text-zinc-800 dark:bg-[#0b0b10] dark:border-[#272738] dark:text-zinc-200 focus:outline-none focus:border-primary text-xs cursor-pointer h-8 justify-between">
                        <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-zinc-200 text-zinc-800 dark:bg-[#0b0b10] transform -translate-x-1 dark:border-[#272738] dark:text-zinc-200 text-xs" alignItemWithTrigger >
                        {Object.keys(fontsMap).map((fontName) => (
                            <SelectItem key={fontName} value={fontName} className="hover:bg-primary/20 focus:bg-primary/20 text-zinc-800 dark:text-zinc-200 cursor-pointer">
                                {fontName}
                            </SelectItem>
                        ))}
                        <SelectItem value="custom" className="hover:bg-primary/10 focus:bg-primary/70 text-zinc-800 dark:text-white cursor-pointer">
                            ★ Custom Font...
                        </SelectItem>
                    </SelectContent>
                </Select>
                {isCustom && (
                    <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-2">
                            <button type="button" disabled={isLoading} onClick={() => fileInputRef.current?.click()}
                                className="flex-1 rounded-lg border border-dashed border-zinc-300 dark:border-[#353550] bg-white dark:bg-[#0b0b10] px-2.5 py-1.5 text-[10px] text-zinc-600 dark:text-zinc-400 hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left font-medium">
                                {isLoading ? "Loading…" : isUploaded ? `✓ ${settings.font}` : "Upload font (.ttf/.otf/.woff)"}
                            </button>
                            {isUploaded && (
                                <button type="button" onClick={() => onUpdateSettings({ font: "Caveat", fontSource: "builtin" })}
                                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-[10px] px-1.5 transition-colors"
                                    title="Reset to default font">
                                    ✕
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            onChange={handleFontUpload}
                            className="hidden"
                        />
                        {error && <p className="text-[9px] text-red-500">{error}</p>}
                    </div>
                )}
            </div>
        </div>

    );
};