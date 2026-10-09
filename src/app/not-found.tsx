import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm text-slate-500">404</p>
      <h1 className="mt-2 text-xl font-semibold text-white">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="mt-2 text-sm text-slate-400">
        ลิงก์อาจเสียหรือหน้านี้ถูกย้ายแล้ว ลองกลับไปค้นหา AI ที่เหมาะกับงานของคุณจากหน้าแรก
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
