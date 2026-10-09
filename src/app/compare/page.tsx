import { loadCatalog } from "@/lib/data/loadCatalog";
import { activeTools } from "@/lib/data/toolStatus";
import { CompareApp } from "@/components/CompareApp";
import { readQueryParam } from "@/lib/security/input";

interface ComparePageProps {
  // string[] when ?ids= is repeated in a hand-edited URL.
  searchParams: Promise<{ ids?: string | string[] }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams;
  const selectedIds = readQueryParam(ids)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const catalog = activeTools(loadCatalog());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold text-white">เปรียบเทียบ AI</h1>
      <p className="mt-1 text-sm text-slate-400">เลือก AI สูงสุด 4 ตัว เพื่อดูตารางเปรียบเทียบเคียงข้างกัน</p>

      <CompareApp catalog={catalog} initialSelectedIds={selectedIds} />
    </div>
  );
}
