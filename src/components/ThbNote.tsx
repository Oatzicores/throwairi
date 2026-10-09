import { RATE_DATE, RATE_SOURCE_NAME, RATE_SOURCE_URL, THB_PER_USD } from "@/lib/currency";

const thaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });

/** Says how the baht figures were made, so nobody mistakes them for the vendor's own price. */
export function ThbNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-slate-500 ${className}`}>
      ราคาเป็นเงินบาท (≈) คำนวณโดยประมาณจากราคาดอลลาร์ของผู้ให้บริการ ที่อัตรา 1 USD = {THB_PER_USD.toFixed(2)} บาท ณ{" "}
      {thaiDate(RATE_DATE)} (อัตราจาก{" "}
      <a href={RATE_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        {RATE_SOURCE_NAME}
      </a>
      ) ยอดที่จ่ายจริงขึ้นกับอัตราของธนาคาร/บัตร ภาษี และราคาที่ผู้ให้บริการเรียกเก็บ
    </p>
  );
}
