import Link from "next/link";
import type { Metadata } from "next";
import { loadCatalog } from "@/lib/data/loadCatalog";
import { activeTools } from "@/lib/data/toolStatus";
import { isRecentlyUpdated } from "@/lib/freshness";
import { CATEGORY_LABELS } from "@/lib/labels";

export const metadata: Metadata = {
  title: "AI ที่เพิ่งอัปเดต — ThrowAirI",
  description: "รวม AI ที่ผู้ให้บริการเพิ่งอัปเดตโมเดล/ฟีเจอร์ใหม่ในช่วง 7 วันที่ผ่านมา",
};

export default function UpdatesPage() {
  const catalog = activeTools(loadCatalog());

  const withDates = catalog
    .filter((t) => t.lastProductUpdate)
    .sort(
      (a, b) =>
        new Date(b.lastProductUpdate!.value).getTime() - new Date(a.lastProductUpdate!.value).getTime(),
    );

  const recentlyUpdated = withDates.filter((t) => isRecentlyUpdated(t.lastProductUpdate!.value));
  const older = withDates.filter((t) => !isRecentlyUpdated(t.lastProductUpdate!.value));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-white">AI ที่เพิ่งอัปเดต</h1>
      <p className="mt-1 text-sm text-slate-400">
        รวมวันที่ผู้ให้บริการ AI แต่ละเจ้าอัปเดตโมเดล/ฟีเจอร์ล่าสุดที่ยืนยันได้ — ตัวที่อัปเดตภายใน 7
        วันจะขึ้นวันที่เป็นสีรุ้งเหมือนที่เห็นในหน้าอื่นๆ ของแอป
      </p>

      {recentlyUpdated.length === 0 ? (
        <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-500">
          ไม่มี AI ตัวไหนอัปเดตภายใน 7 วันที่ผ่านมา — ดูรายการทั้งหมดด้านล่างแทน
        </p>
      ) : (
        <>
          <h2 className="mt-8 text-sm font-semibold text-slate-300">🌈 อัปเดตภายใน 7 วันที่ผ่านมา</h2>
          <div className="mt-3 space-y-2">
            {recentlyUpdated.map((tool) => (
              <UpdateRow key={tool.id} tool={tool} fresh />
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold text-slate-300">รายการอื่นๆ เรียงตามวันที่อัปเดตล่าสุด</h2>
      <div className="mt-3 space-y-2">
        {older.map((tool) => (
          <UpdateRow key={tool.id} tool={tool} fresh={false} />
        ))}
      </div>
    </div>
  );
}

function UpdateRow({
  tool,
  fresh,
}: {
  tool: ReturnType<typeof loadCatalog>[number];
  fresh: boolean;
}) {
  const update = tool.lastProductUpdate!;
  return (
    <Link
      href={`/tool/${tool.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 hover:border-slate-600"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{tool.name}</span>
          <span className="text-xs text-slate-500">{tool.vendor}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {tool.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}
          {update.note ? ` — ${update.note}` : ""}
        </p>
      </div>
      <span className={`flex-none text-sm ${fresh ? "rainbow-text" : "text-slate-400"}`}>
        {update.value}
      </span>
    </Link>
  );
}
