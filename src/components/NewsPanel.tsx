import { filterNewsByKeywords, getLatestAINews } from "@/lib/sources/news";

function formatThaiDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    });
  } catch {
    return iso;
  }
}

export async function NewsPanel({ keywords }: { keywords: string[] }) {
  let items: Awaited<ReturnType<typeof getLatestAINews>>["items"] = [];
  let fetchedAt = "";
  let fetchFailed = false;

  try {
    const news = await getLatestAINews();
    items = filterNewsByKeywords(news.items, keywords);
    fetchedAt = news.fetchedAt;
  } catch {
    fetchFailed = true;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-sm font-semibold text-white">ข่าว AI ล่าสุดที่เกี่ยวข้อง</h2>
      {fetchedAt && (
        <p className="mt-0.5 text-[11px] text-slate-500">
          ดึงข้อมูลล่าสุดเมื่อ {formatThaiDateTime(fetchedAt)}
        </p>
      )}
      {fetchFailed && (
        <p className="mt-2 text-xs text-amber-400">ไม่สามารถดึงข่าวได้ในขณะนี้ ลองรีเฟรชอีกครั้ง</p>
      )}
      {!fetchFailed && items.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">ไม่พบข่าวที่เกี่ยวข้องในตอนนี้</p>
      )}
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.url} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-200 hover:text-violet-300"
            >
              {item.title}
            </a>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
              <span>{item.source}</span>
              <span>·</span>
              <span>{formatThaiDateTime(item.publishedAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
