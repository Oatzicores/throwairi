import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "แจ้งแก้ไขข้อมูล — ThrowAirI",
  description: "วิธีแจ้งข้อมูลที่ผิดหรือล้าสมัยบน ThrowAirI และสิ่งที่เราจะทำหลังได้รับแจ้ง",
};

export default function CorrectionsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← กลับหน้าแรก
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-white">แจ้งแก้ไขข้อมูล</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        ราคาและเงื่อนไขของ AI เปลี่ยนเร็ว และข้อมูลของเราอาจผิดหรือตามไม่ทัน ถ้าคุณเจอ บอกเรา เรายินดีแก้และจะไม่ถือว่าเป็นการตำหนิ
      </p>

      <div className="mt-6 space-y-8 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="mb-2 font-semibold text-white">ช่องทางแจ้ง</h2>
          {CONTACT_EMAIL ? (
            <p>
              ส่งอีเมลมาที่{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-violet-400 underline hover:text-violet-300"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          ) : (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
              ตอนนี้เรายังไม่ได้เปิดช่องทางรับแจ้งสาธารณะ เมื่อเปิดแล้วจะแสดงที่หน้านี้
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">ช่วยระบุอะไรบ้าง</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>ชื่อเครื่องมือ และข้อมูลที่คิดว่าผิด (เช่น ราคาแผนไหน หรือสิทธิ์เชิงพาณิชย์)</li>
            <li>ข้อมูลที่ถูกต้องตามที่คุณเห็น</li>
            <li>ลิงก์หน้าทางการที่ยืนยันได้ (ถ้ามี) จะช่วยให้เราตรวจได้เร็วขึ้นมาก</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">เราจะทำอะไรหลังได้รับแจ้ง</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>เปิดอ่านหน้าทางการของผู้ให้บริการด้วยตัวเอง ไม่แก้ตามที่แจ้งโดยไม่ตรวจ</li>
            <li>ถ้าผิดจริง แก้ข้อมูล อัปเดตลิงก์แหล่งที่มาและวันที่ตรวจล่าสุด</li>
            <li>ถ้าตรวจแล้วข้อมูลเดิมถูกต้อง หรือยืนยันไม่ได้ เราจะปรับระดับความเชื่อมั่นให้ตรงความจริง</li>
          </ol>
          <p className="mt-2 text-slate-400">
            เรายังไม่ได้กำหนดระยะเวลาตอบกลับที่แน่นอน เพราะเว็บนี้ดูแลโดยคนคนเดียว
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-white">เจ้าของผลิตภัณฑ์</h2>
          <p>
            ถ้าคุณเป็นตัวแทนของเครื่องมือที่อยู่ในรายการและต้องการให้แก้ข้อมูล แจ้งได้ช่องทางเดียวกัน เราจะตรวจกับหน้าทางการของคุณเช่นเดียวกัน
            การแก้ไขต้องมีแหล่งอ้างอิงที่เปิดตรวจสอบได้ และการติดต่อกับเราไม่มีผลต่อคะแนนหรืออันดับ
          </p>
        </section>

        <p>
          วิธีที่เราจัดอันดับและตรวจข้อมูล:{" "}
          <Link href="/methodology" className="text-violet-400 underline hover:text-violet-300">
            อ่านที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}
