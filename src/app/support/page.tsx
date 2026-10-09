import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { DONATE_METHODS, formatPhone, getDonatePhone, promptPayPayload } from "@/lib/donate";
import { CopyValueButton } from "@/components/CopyValueButton";

export const metadata: Metadata = {
  title: "สนับสนุน ThrowAirI — บริจาคผ่าน PromptPay / TrueMoney Wallet",
  description: "ช่วยให้ ThrowAirI ยังเปิดให้ใช้ฟรีต่อไป บริจาคด้วย PromptPay หรือ TrueMoney Wallet การบริจาคไม่มีผลต่ออันดับ",
};

export default async function SupportPage() {
  const donatePhone = getDonatePhone();
  if (!donatePhone) return <DonationsClosed />;

  // Drawn on the server from our own payload: no third-party QR service sees the number or the visitor.
  const qrSvg = await QRCode.toString(promptPayPayload(donatePhone), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  const { promptpay, truemoney } = DONATE_METHODS;
  const phone = formatPhone(donatePhone);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← กลับหน้าแรก
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
        <span className="text-pink-300">♥</span> สนับสนุน ThrowAirI
      </h1>
      <p className="mt-3 leading-relaxed text-slate-300">
        ThrowAirI เปิดให้ใช้ฟรี ทุกข้อมูลมีแหล่งอ้างอิงและตรวจซ้ำอยู่เสมอ ถ้าเว็บนี้ช่วยคุณเลือก AI ได้ดีขึ้น
        คุณช่วยเป็นค่ากาแฟให้คนทำได้ตามสะดวก ไม่มีขั้นต่ำ
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-violet-500/25 bg-slate-900/60 p-5 shadow-[0_0_28px_-14px_rgba(139,92,246,0.7)]">
          <span className="inline-flex rounded-lg bg-white px-2 py-1">
            <Image
              src={promptpay.logo}
              alt={promptpay.name}
              width={promptpay.logoWidth}
              height={promptpay.logoHeight}
              unoptimized
              className="h-7 w-auto"
            />
          </span>
          <p className="mt-3 text-sm text-slate-400">
            สแกนด้วยแอปธนาคารหรือแอปอื่นที่รองรับ PromptPay แล้วใส่จำนวนเงินเอง
          </p>
          <div
            role="img"
            aria-label={`QR PromptPay เบอร์ ${phone}`}
            className="mx-auto mt-4 w-56 overflow-hidden rounded-xl border-4 border-white bg-white [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-3 text-center font-mono text-lg text-white">{phone}</p>
          <div className="mt-2 flex justify-center">
            <CopyValueButton value={donatePhone} label="เบอร์ PromptPay" />
          </div>
        </section>

        <section className="rounded-2xl border border-violet-500/25 bg-slate-900/60 p-5 shadow-[0_0_28px_-14px_rgba(139,92,246,0.7)]">
          <span className="inline-flex rounded-lg bg-white px-2 py-1.5">
            <Image
              src={truemoney.logo}
              alt={truemoney.name}
              width={truemoney.logoWidth}
              height={truemoney.logoHeight}
              unoptimized
              className="h-7 w-auto"
            />
          </span>
          <p className="mt-3 text-sm text-slate-400">
            เปิดแอป TrueMoney เลือก &ldquo;โอนเงิน&rdquo; แล้วกรอกเบอร์ด้านล่าง (ยังไม่มี QR ของ TrueMoney ในหน้านี้
            เพราะ QR ต้องออกจากแอปของเจ้าของบัญชี)
          </p>
          <p className="mt-6 text-center font-mono text-2xl text-white">{phone}</p>
          <div className="mt-2 flex justify-center">
            <CopyValueButton value={donatePhone} label="เบอร์ TrueMoney Wallet" />
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm leading-relaxed text-slate-400">
        <h2 className="text-base font-semibold text-slate-200">ก่อนโอน โปรดอ่าน</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            ตรวจ <strong className="text-slate-200">ชื่อผู้รับในแอปธนาคาร/แอปกระเป๋าเงิน</strong>{" "}
            ให้ตรงกับที่คุณคาดไว้ก่อนกดยืนยัน ทุกครั้ง
          </li>
          <li>
            การบริจาคเป็นการให้โดยสมัครใจ <strong className="text-slate-200">ไม่มีสิทธิ์พิเศษตอบแทน</strong>{" "}
            และไม่มีใบเสร็จรับรองสำหรับลดหย่อนภาษี
          </li>
          <li>
            เงินบริจาค <strong className="text-slate-200">ไม่มีผลต่ออันดับหรือคะแนนของ AI ใดๆ</strong> ตามหลักในหน้า{" "}
            <Link href="/methodology" className="underline hover:text-slate-200">
              วิธีที่เราจัดอันดับ
            </Link>
          </li>
          <li>
            เว็บนี้ไม่เคยขอรหัสผ่าน รหัส OTP หรือข้อมูลบัตรจากคุณ ถ้ามีใครอ้างชื่อ ThrowAirI แล้วขอสิ่งเหล่านี้
            ให้ไม่ทำตามและแจ้งเรา
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          โลโก้ PromptPay และ TrueMoney เป็นเครื่องหมายการค้าของเจ้าของแต่ละราย ใช้เพื่อบอกช่องทางรับบริจาคเท่านั้น
        </p>
      </section>
    </div>
  );
}

/** Shown when DONATE_PHONE is not set (a fork, a preview build, or before the owner sets it). */
function DonationsClosed() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← กลับหน้าแรก
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">สนับสนุน ThrowAirI</h1>
      <p className="mt-3 leading-relaxed text-slate-300">ตอนนี้ยังไม่เปิดรับบริจาคผ่านหน้านี้ ขอบคุณที่แวะมาครับ</p>
    </div>
  );
}
