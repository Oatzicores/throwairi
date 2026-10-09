import type { AITool } from "@/lib/types/ai-tool";

const KIND_LABEL = {
  retirement: "กำหนดเลิกใช้/ปิดตัว",
  announced: "ประกาศแล้ว",
  intent: "ความตั้งใจที่ประกาศ",
} as const;

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
};

/**
 * "แผนในอนาคตที่ผู้พัฒนาประกาศ": only what the vendor itself published, each item with its timeframe as
 * the vendor gave it and a link. Most vendors publish no product roadmap, so the honest common case is
 * an empty list with the date we checked. We never fill it with guesses.
 */
export function RoadmapSection({ tool }: { tool: AITool }) {
  const r = tool.roadmap;
  return (
    <section
      aria-labelledby="roadmap-heading"
      className="mt-6 rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4 sm:p-5"
    >
      <h2 id="roadmap-heading" className="text-base font-semibold text-white">
        แผนในอนาคตที่ {tool.vendor} ประกาศ
      </h2>
      {!r ? (
        <p className="mt-2 text-sm text-slate-500">ยังไม่ได้ตรวจสอบข้อมูลส่วนนี้ของเครื่องมือนี้</p>
      ) : (
        <>
          {r.items.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {r.items.map((it) => (
                <li key={it.text} className="text-sm leading-relaxed text-slate-300">
                  <span className="mr-2 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                    {KIND_LABEL[it.kind]}
                  </span>
                  <span className="font-medium text-white">{it.when ?? "ไม่ระบุกำหนดเวลา"}</span>
                  <span className="text-slate-400"> · </span>
                  {it.text}{" "}
                  <a href={it.sourceUrl} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-violet-400 hover:underline">
                    แหล่งที่มา ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              ตรวจเมื่อ {formatDate(r.checkedAt)}: ยังไม่พบแผนหรือกำหนดเวลาในอนาคตที่ผู้ให้บริการประกาศไว้เอง
            </p>
          )}
          {r.note && <p className="mt-2 text-xs leading-relaxed text-slate-500">{r.note}</p>}
          <p className="mt-3 text-xs text-slate-600">
            แสดงเฉพาะสิ่งที่ผู้ให้บริการเผยแพร่เอง (เช่น กำหนดเลิกใช้โมเดล) ไม่ใช่การคาดเดาของเรา ผู้ให้บริการส่วนใหญ่ไม่เปิดเผยแผนผลิตภัณฑ์ล่วงหน้า
            ตรวจล่าสุด {formatDate(r.checkedAt)}
          </p>
        </>
      )}
    </section>
  );
}
