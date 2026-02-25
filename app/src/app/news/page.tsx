import { getGitHubData } from "@/lib/data";
import { NewspaperPage } from "./NewspaperPage";
import { NewspaperHeader } from "./NewspaperHeader";
import type { Metadata } from "next";

// Force dynamic rendering so data is always fresh after admin refresh
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "News | Tremors",
    description: "Editorial-style portfolio layout. Projects and skills presented in a classic newspaper format.",
};

export default async function Page() {
    const data = await getGitHubData();

    return (
        <main className="min-h-screen">
            <NewspaperHeader />
            <NewspaperPage data={data} />
        </main>
    );
}
