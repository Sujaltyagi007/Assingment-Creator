import type { Metadata } from "next";
import { Signika, Geist } from "next/font/google";
import { caveat, kalam, patrickHand, shadowsIntoLight, indieFlower, gochiHand } from "@/lib/fonts";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const varela = Signika({
  subsets: ["latin"],
  variable: "--font-varela-round",
  weight: ["400"]
});

export const metadata: Metadata = {
  title: "Assignment Creator",
  description: "Generate handwriting sheets instantly",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", varela.variable, varela.className, caveat.variable, kalam.variable, patrickHand.variable, shadowsIntoLight.variable, indieFlower.variable, gochiHand.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
