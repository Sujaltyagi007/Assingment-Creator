"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { Style } from "@/components/Style";
import { WriteTab } from "@/components/WriteTab";
import { Options } from "@/components/Options";
import { HomeTextArea } from "@/components/WriteTab/HomeTextArea";
import { useFormatText } from "@/lib/hooks/handleFormatText";
import type { GlobalSettings, RealismSettings } from "@/lib/types";

interface SidebarProps {
    content: string;
    onContentChange: (content: string) => void;
    onAddImage?: (src: string, width: number, height: number) => void;
    settings: GlobalSettings;
    onUpdateSettings: (settings: Partial<GlobalSettings>) => void;
    onUpdateRealism: (realism: Partial<RealismSettings>) => void;
    onExportPNG: () => Promise<void>;
    onExportPDF: () => Promise<void>;
    pageCount: number;
}

type Tabs = "write" | "style" | "settings";

export default function Sidebar({ content, onContentChange, onAddImage, settings, onUpdateSettings, onUpdateRealism, onExportPNG, onExportPDF, pageCount }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<Tabs>("write");
    const { hasSelection, activeFormats, handleSelectionChange, handleFormatText } = useFormatText();
    const randomizeSeed = () => { onUpdateRealism({ seed: Math.floor(Math.random() * 100) + 1 }); };
    const applyPreset = (preset: "standard" | "cbse") => {
        if (preset === "standard") {
            onUpdateSettings({
                marginPreset: "standard",
                topMargin: 105,
                leftMargin: 105,
            });
        } else {
            onUpdateSettings({
                marginPreset: "cbse",
                topMargin: 120,
                leftMargin: 135,
            });
        }
    };

    const tabs: { id: Tabs; label: string; content: React.ReactNode }[] = [
        {
            id: "write",
            label: "WRITE",
            content: <WriteTab hasSelection={hasSelection} onFormatText={handleFormatText} onAddImage={onAddImage} />,
        },
        {
            id: "style",
            label: "STYLE",
            content: <Style settings={settings} onUpdateSettings={onUpdateSettings} onUpdateRealism={onUpdateRealism} randomizeSeed={randomizeSeed} applyPreset={applyPreset} />,
        },
        {
            id: "settings",
            label: "SETTINGS",
            content: <Options settings={settings} pageCount={pageCount} onUpdateSettings={onUpdateSettings} onExportPNG={onExportPNG} onExportPDF={onExportPDF} />,
        },
    ];

    return (
        <aside className="flex h-full w-full flex-col bg-white text-zinc-800 border-r border-zinc-200 dark:bg-[#09090b] dark:text-zinc-200 dark:border-[#1f1f28] select-none transition-colors duration-200">
            <div className="grid grid-cols-3 border-b border-zinc-200 bg-zinc-100/80 dark:border-[#1f1f28] dark:bg-[#111116]">
                {tabs.map((tab, index) => (
                    <button key={index} type="button" onClick={() => setActiveTab(tab.id)} className={`relative py-3.5 text-xs font-bold tracking-wider transition-colors ${activeTab === tab.id ? "text-primary" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"}`}>
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.span
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(255,85,51,0.6)]"
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex flex-1 flex-col p-3.5 overflow-y-auto gap-4 [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full ">
                {activeTab === "write" && (
                    <>
                        <WriteTab hasSelection={hasSelection} onFormatText={handleFormatText} activeFormats={activeFormats} />
                        <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                            <HomeTextArea content={content} onContentChange={onContentChange} autoCorrect={settings.autoCorrect} onSelectionChange={handleSelectionChange} onAddImage={onAddImage} />
                        </div>
                    </>
                )}

                {activeTab === "style" && (
                    <Style settings={settings} onUpdateSettings={onUpdateSettings} onUpdateRealism={onUpdateRealism} randomizeSeed={randomizeSeed} applyPreset={applyPreset} />
                )}

                {activeTab === "settings" && (
                    <Options settings={settings} pageCount={pageCount} onUpdateSettings={onUpdateSettings} onExportPNG={onExportPNG} onExportPDF={onExportPDF} />
                )}
            </div>
        </aside>
    );
}