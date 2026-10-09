import Link from "next/link";
import type { Metadata } from "next";
import { SCORE_WEIGHTS } from "@/lib/match/score";
import { loadCatalog } from "@/lib/data/loadCatalog";
import { activeTools } from "@/lib/data/toolStatus";
import { CONFIDENCE_LABELS } from "@/lib/labels";

export const metadata: Metadata = {
  title: "เราจัดอันดับและตรวจข้อมูลอย่างไร — ThrowAirI",
  description:
    "อธิบายสูตรคะแนน ข้อจำกัดของระบบจัดอันดับ และวิธีตรวจแหล่งอ้างอิงของข้อมูลทุกข้อบน ThrowAirI",
};

const pct = (w: number) => `${Math.round(w * 100)}%`;

export default function MethodologyPage() {
  const toolCount = activeTools(loadCatalog()).length;

  const dimensions = [
    {
      name: "ความตรงกับงาน",
      weight: SCORE_WEIGHTS.taskFit,
      text: "ตรวจว่าเครื่องมือนี้อยู่ในประเภทงานที่คำขอของคุณต้องการหรือไม่ ตรงประเภทหลักได้เต็ม 100 ตรงประเภทรองได้ 70 ถ้าไม่ตรงแต่คะแนนความสามารถด้านนั้นสูงพอ จะได้คะแนนบางส่วน มิฉะนั้นได้ 20",
    },
    {
      name: "คุณภาพ",
      weight: SCORE_WEIGHTS.quality,
      text: "ค่าเฉลี่ยของคะแนนความสามารถ (0-100) ในด้านที่เกี่ยวกับงานนั้น เฉพาะค่าที่มีแหล่งอ้างอิง ถ้าไม่มีค่าที่ยืนยันได้เลยจะใช้ 50 เป็นค่ากลาง",
    },
    {
      name: "ความง่ายในการเข้าถึง",
      weight: SCORE_WEIGHTS.accessibility,
      text: "ดูจากรูปแบบราคา: ฟรีสูงสุด ตามด้วยฟรีเมียม แบบเสียเงิน และแบบคิดตามการใช้งาน บวกเพิ่มถ้าเครื่องมือระบุว่าเหมาะกับมือใหม่",
    },
    {
      name: "ความเหมาะกับงบ",
      weight: SCORE_WEIGHTS.costFit,
      text: "เทียบรูปแบบราคากับงบที่คุณเลือก (ฟรีเท่านั้น / จ่ายได้ / ไม่ระบุ) ถ้าไม่ระบุ ระบบเอนไปทางตัวเลือกที่เริ่มต้นได้ง่าย",
    },
    {
      name: "หลักฐานการใช้งานจริง",
      weight: SCORE_WEIGHTS.popularity,
      text: "เทียบตัวชี้วัดการใช้งานสาธารณะ (เช่น อันดับ LMArena ยอดดาวน์โหลดโมเดล) กับเครื่องมืออื่นในแคตตาล็อก ถ้าไม่มีข้อมูลที่อ้างอิงได้ ใช้ค่า 30 ไม่ใช่ 0",
    },
  ];

  const confidenceRows: { key: keyof typeof CONFIDENCE_LABELS; text: string }[] = [
    { key: "verified", text: "อ่านจากหน้าทางการของผู้ให้บริการโดยตรงในวันที่ตรวจ" },
    {
      key: "probable",
      text: "ข้อมูลมาจากแหล่งอื่นที่ไม่ใช่ผู้ให้บริการเอง (เช่น บทวิเคราะห์เงื่อนไขการใช้งานของบุคคลที่สาม) หรือจากหน้าทางการที่ไม่ได้ระบุตรงๆ ป้ายนี้จะมีลิงก์แหล่งข้อมูลและบอกว่าเป็นข้อมูลเรื่องอะไร ให้เปิดตรวจเอง และอ่านเงื่อนไขทางการซ้ำก่อนตัดสินใจทางธุรกิจ",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← กลับหน้าแรก
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-white">เราจัดอันดับและตรวจข้อมูลอย่างไร</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        หน้านี้อธิบายวิธีที่ ThrowAirI เรียงลำดับ AI ให้คุณ และวิธีที่เราตรวจข้อมูล รวมถึงข้อจำกัดที่เรารู้อยู่แล้ว
      </p>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="mb-2 font-semibold text-white">อันดับมาจากอะไร</h2>
          <p>
            คะแนนรวมของแต่ละเครื่องมือ (0-100) คือผลรวมถ่วงน้ำหนักของ 5 ด้านนี้ น้ำหนักด้านล่างดึงมาจากโค้ดที่ใช้จัดอันดับจริง
          </p>
          <ul className="mt-3 space-y-3">
            {dimensions.map((d) => (
              <li key={d.name} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-white">{d.name}</span>
                  <span className="text-violet-300">{pct(d.weight)}</span>
                </div>
                <p className="mt-1 text-slate-400">{d.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">สิ่งที่ไม่มีผลต่ออันดับ</h2>
          <p>
            เงินไม่ใช่ตัวแปรในสูตรข้างบน ค่าคอมมิชชัน การมีโปรแกรมพันธมิตร หรือการสนับสนุนใดๆ จะไม่ถูกนำมาคิดคะแนน
            ปัจจุบันเว็บนี้ยังไม่มีรายได้จากลิงก์หรือโฆษณา หากในอนาคตมี ลิงก์เหล่านั้นจะมีป้ายบอกชัดเจน และอันดับจะยังคำนวณด้วยสูตรเดิม
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">ข้อจำกัดที่เราบอกตรงๆ</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              แคตตาล็อกตอนนี้มี <strong className="text-white">{toolCount} เครื่องมือ</strong> ไม่ครอบคลุม AI ทั้งหมดในโลก
              ถ้าตัวที่คุณสนใจไม่อยู่ในรายการ ไม่ได้แปลว่าไม่ดี
            </li>
            <li>
              การเข้าใจคำขอใช้การจับคำสำคัญภาษาไทยและอังกฤษ ไม่ได้ใช้ AI ตีความ คำขอที่ใช้ถ้อยคำแปลกอาจถูกจับคู่ผิดประเภท
              ดูตัวอย่างการจับคำได้ในบล็อกวิเคราะห์ Prompt บนหน้าผลลัพธ์
            </li>
            <li>
              ด้านความง่ายในการเข้าถึงให้คะแนนเครื่องมือฟรีสูงกว่า โดยตั้งใจ เพราะเว็บนี้เอาใจคนที่เพิ่งเริ่มใช้ AI
              คนที่ต้องการคุณภาพสูงสุดโดยไม่สนราคาควรดูคะแนนแต่ละด้านแยก ไม่ใช่แค่คะแนนรวม
            </li>
            <li>
              คะแนนความสามารถบางค่ามาจากแหล่งที่ระดับความเชื่อมั่นไม่สูง (ดูป้ายกำกับข้างค่านั้น) และตัวชี้วัดความนิยมบางตัวยังไม่มีข้อมูล
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">เราตรวจข้อมูลอย่างไร</h2>
          <p>
            ข้อมูลที่เปลี่ยนแปลงได้ เช่น ราคา สิทธิ์เชิงพาณิชย์ และคะแนนความสามารถ จะเก็บพร้อมป้ายระดับความเชื่อมั่น
            ลิงก์แหล่งที่มา และวันที่ตรวจล่าสุดเสมอ ข้อมูลที่ไม่มีแหล่งอ้างอิงจะถูกบันทึกเป็น &quot;ไม่ทราบ&quot; ไม่ใช่ตัวเลขที่เดามา
          </p>
          <ul className="mt-3 space-y-2">
            {confidenceRows.map((row) => (
              <li key={row.key} className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                <span className="w-full flex-none font-medium text-white sm:w-56">{CONFIDENCE_LABELS[row.key]}</span>
                <span className="text-slate-400">{row.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            ก่อนเผยแพร่ข้อมูลใหม่ เรารันสคริปต์ตรวจว่ารูปแบบข้อมูลถูกต้อง ทุกข้อที่ระบุว่ายืนยันแล้วมีแหล่งอ้างอิงและวันที่ตรวจ
            และลิงก์แหล่งที่มายังเปิดได้ บนหน้าผลลัพธ์ ถ้าข้อมูลราคาตรวจล่าสุดนานเกิน 30 วัน เราจะแสดงคำเตือนให้เห็นชัด
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">พบข้อมูลผิด?</h2>
          <p>
            เราไม่รับประกันว่าไม่มีข้อผิดพลาด แต่เราแก้ให้จริง ดู{" "}
            <Link href="/corrections" className="text-violet-400 underline hover:text-violet-300">
              วิธีแจ้งแก้ไขข้อมูลและสิ่งที่เราจะทำ
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
