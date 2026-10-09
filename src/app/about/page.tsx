import Link from "next/link";
import type { Metadata } from "next";
import { loadCatalog } from "@/lib/data/loadCatalog";
import { activeTools } from "@/lib/data/toolStatus";
import { buildResultsHref } from "@/lib/resultsUrl";

export const metadata: Metadata = {
  title: "ThrowAirI คืออะไร — หา AI ที่ใช่ ราคาเป็นบาท",
  description:
    "พิมพ์งานที่อยากทำ แล้วได้ AI ที่เหมาะ พร้อมราคาเป็นบาท สิทธิ์เชิงพาณิชย์ และแหล่งข้อมูลที่ตรวจได้ ฟรี ไม่ต้องสมัคร",
};

const examples = [
  { label: "ทำคลิป TikTok", q: "ทำคลิปสั้นลง TikTok" },
  { label: "ทำปกเพลง", q: "ทำภาพปกเพลง" },
  { label: "พากย์เสียงไทย", q: "ทำเสียงพากย์ภาษาไทย" },
];

const problems = [
  { before: "เปิด 10 แท็บเพื่อเทียบ AI", after: "ผลลัพธ์และเปรียบเทียบอยู่หน้าเดียว" },
  { before: "ราคาเป็นดอลลาร์ คิดเป็นบาทเองไม่ทัน", after: "แสดงราคาประมาณเป็นบาท (≈ ฿) ให้เลย" },
  { before: "ไม่รู้ว่าแผนนี้ใช้ทำงานขายได้ไหม", after: "บอกสิทธิ์เชิงพาณิชย์ของแต่ละแผน" },
  { before: "ข้อมูลเก่าหรือเปล่า?", after: "ทุกข้อมูลมีลิงก์แหล่งที่มาและวันที่ตรวจ" },
];

const faq = [
  { q: "ใช้ฟรีไหม", a: "ฟรี ไม่ต้องสมัครสมาชิก" },
  {
    q: "เว็บนี้ได้เงินจากไหน",
    a: "ตอนนี้ยังไม่มีรายได้จากลิงก์หรือโฆษณา มีเพียงการรับบริจาคที่หน้าสนับสนุน และอันดับไม่ได้ขาย เงินไม่มีผลต่อลำดับ",
  },
  { q: "ข้อมูลมาจากไหน", a: "จากหน้าทางการของผู้ให้บริการแต่ละราย ทุกค่ามีลิงก์และวันที่ตรวจ ถ้าไม่มีแหล่งจริงเราบอกว่าไม่ทราบ ไม่เดา" },
];

export default function AboutPage() {
  const tools = activeTools(loadCatalog());
  const latest = tools.map((t) => t.lastUpdated).sort().at(-1);
  const latestText = latest
    ? new Date(latest).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← กลับหน้าแรก
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-white">พิมพ์งานที่อยากทำ ได้ AI ที่เหมาะ พร้อมราคาเป็นบาท</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        ThrowAirI ช่วยครีเอเตอร์ไทยเลือก AI สำหรับทำวิดีโอ ภาพ และเสียง ลองก่อนได้เลย ไม่ต้องสมัคร
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((e) => (
          <Link
            key={e.label}
            href={buildResultsHref({ q: e.q })}
            className="inline-flex min-h-[44px] items-center rounded-full border border-violet-400/40 bg-slate-900/70 px-4 text-sm text-violet-200 hover:border-violet-300 hover:text-white"
          >
            {e.label}
          </Link>
        ))}
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-full bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
        >
          พิมพ์งานของคุณเอง
        </Link>
      </div>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="mb-3 font-semibold text-white">ปัญหาเดิม และเราแก้อย่างไร</h2>
          <ul className="space-y-2">
            {problems.map((p) => (
              <li key={p.before} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-slate-500 line-through">{p.before}</p>
                <p className="mt-1 text-white">{p.after}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">ทำไมเชื่อถือได้</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-white">อันดับไม่ได้ขาย</strong> คำนวณจากข้อมูลของเครื่องมือและคำขอของคุณเท่านั้น ดู{" "}
              <Link href="/methodology" className="text-violet-400 underline hover:text-violet-300">
                วิธีคิดคะแนน
              </Link>
            </li>
            <li>
              ผิดตรงไหนแจ้งได้ที่{" "}
              <Link href="/corrections" className="text-violet-400 underline hover:text-violet-300">
                หน้าแจ้งแก้ไขข้อมูล
              </Link>
            </li>
          </ul>
          <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-slate-400">
            ตอนนี้มี <strong className="text-white">{tools.length} เครื่องมือ</strong>
            {latestText && <> อัปเดตข้อมูลล่าสุด {latestText}</>}
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">คำถามที่พบบ่อย</h2>
          <dl className="space-y-3">
            {faq.map((f) => (
              <div key={f.q}>
                <dt className="font-medium text-white">{f.q}</dt>
                <dd className="mt-0.5 text-slate-400">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p>
          <Link href="/support" className="text-violet-400 underline hover:text-violet-300">
            สนับสนุน ThrowAirI
          </Link>
        </p>
      </div>
    </div>
  );
}
