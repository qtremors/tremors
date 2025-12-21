import { getGitHubData } from "@/lib/data";
import { PaperPage } from "./PaperPage";
import { Header } from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Paper Mode | Aman Singh",
    description: "Document-style portfolio with sidebar navigation. A clean, minimal reading experience.",
};

export default async function Page() {
    const data = await getGitHubData();

    return (
        <main className="min-h-screen">
            <Header currentMode="paper" />
            <PaperPage data={data} />
        </main>
    );
}

