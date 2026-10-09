import { PromptForm } from "@/components/PromptForm";
import { CategoryBoxes } from "@/components/CategoryBoxes";
import { CategoryChips, HowItWorks, RecentUpdatesRow } from "@/components/HomeSections";
import { loadCatalog } from "@/lib/data/loadCatalog";

export default function Home() {
  const catalog = loadCatalog();
  return (
    <>
      <div className="relative isolate flex flex-col items-center overflow-hidden px-4 py-16 sm:py-24">
        {/* Violet-to-blue glow behind the search box (decorative). */}
        {/* Radial gradients instead of blur filters: same look, far cheaper to paint. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(40rem 22rem at 50% -4rem, rgba(124,58,237,0.38), transparent 70%), radial-gradient(24rem 18rem at 12% 14%, rgba(37,99,235,0.28), transparent 70%), radial-gradient(22rem 16rem at 88% 20%, rgba(192,38,211,0.22), transparent 70%)",
          }}
        />
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-5xl">
            หา AI ที่ใช่ จาก{" "}
            <span className="bg-gradient-to-r from-violet-300 to-blue-400 bg-clip-text text-transparent">
              Prompt เดียว
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            บอกสิ่งที่อยากทำ ระบบจะแนะนำ AI หลายตัวเรียงตามความเหมาะสม
            พร้อมเหตุผล ราคา และข้อมูลที่มาจากแหล่งข้อมูลจริงทุกจุด
          </p>
        </div>
        <PromptForm />
        <CategoryChips />
      </div>
      <RecentUpdatesRow catalog={catalog} />
      <div className="pt-14">
        <CategoryBoxes catalog={catalog} />
      </div>
      <HowItWorks />
    </>
  );
}
