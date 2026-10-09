import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { ThbNote } from "@/components/ThbNote";
import { DonateButton } from "@/components/DonateButton";
import { MembershipSlot } from "@/components/MembershipSlot";
import { MobileSupportBar } from "@/components/MobileSupportBar";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ThrowAirI — หา AI ที่ใช่ จาก Prompt เดียว",
  description:
    "พิมพ์ Prompt เดียว ได้ลิสต์ AI ทั่วโลกเรียงตามความเหมาะสม พร้อมเหตุผล ราคา และรีวิวจากแหล่งข้อมูลจริง",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ThrowAirI",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-[family-name:var(--font-thai)]">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-1">
            <Link href="/" className="flex min-h-[44px] items-center gap-2">
              <span className="relative block h-7 w-7 shrink-0 overflow-hidden rounded-full sm:h-8 sm:w-8">
                <Image
                  src="/icon.png"
                  alt=""
                  fill
                  priority
                  className="object-cover"
                />
              </span>
              <span
                className="text-base font-bold tracking-tight sm:text-lg"
                style={{ color: "#0050F4" }}
              >
                ThrowAirI
              </span>
            </Link>
            <nav className="flex items-center gap-3 text-xs text-slate-300 sm:gap-4 sm:text-sm">
              <Link href="/" className="hidden py-3 hover:text-white sm:inline">
                ค้นหา AI
              </Link>
              <Link href="/compare" className="py-3 whitespace-nowrap hover:text-white">
                เปรียบเทียบ
              </Link>
              <Link href="/updates" className="py-3 whitespace-nowrap hover:text-white">
                เพิ่งอัปเดต
              </Link>
              <Link href="/favorites" className="py-3 whitespace-nowrap hover:text-white">
                ★ บันทึกไว้
              </Link>
              {/* Reserved right-hand slots: Donate now, membership when the flag is on. Phones use the bottom bar. */}
              <span className="hidden items-center gap-2 sm:flex">
                <DonateButton />
                <MembershipSlot />
              </span>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col pb-16 sm:pb-0">{children}</main>
        <footer className="border-t border-slate-800 py-6 pb-20 text-center text-xs text-slate-500 sm:pb-6">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-slate-400">ถ้าชอบ สนับสนุนเลี้ยงค่าข้าวได้ที่</span>
            <DonateButton variant="bar" />
            <MembershipSlot variant="bar" />
          </div>
          <ThbNote className="mx-auto mb-2 max-w-2xl px-4" />
          <p>
            ข้อมูลราคา/รีวิว/ความสามารถของ AI แต่ละตัวมาจากการค้นคว้า ณ ช่วงเวลาที่ระบุในแต่ละหน้า
            อาจเปลี่ยนแปลงได้ — ควรตรวจสอบหน้าราคาทางการอีกครั้งก่อนตัดสินใจซื้อ
          </p>
          <p className="mx-auto mt-2 max-w-2xl px-4">
            ThrowAirI เป็นเว็บไซต์อิสระที่รวบรวมและสังเคราะห์ข้อมูลสาธารณะเพื่อการเปรียบเทียบเท่านั้น
            ไม่มีความเกี่ยวข้อง ไม่ได้เป็นพันธมิตร และไม่ได้รับการรับรองจากบริษัทเจ้าของผลิตภัณฑ์ AI
            ที่ปรากฏในเว็บไซต์นี้แต่อย่างใด ชื่อผลิตภัณฑ์/บริษัททั้งหมดเป็นเครื่องหมายการค้าของเจ้าของแต่ละราย
          </p>
          <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/about" className="inline-block py-2.5 underline hover:text-slate-300">
              ThrowAirI คืออะไร
            </Link>
            <Link href="/methodology" className="inline-block py-2.5 underline hover:text-slate-300">
              เราจัดอันดับและตรวจข้อมูลอย่างไร
            </Link>
            <Link href="/corrections" className="inline-block py-2.5 underline hover:text-slate-300">
              แจ้งแก้ไขข้อมูล
            </Link>
            <Link href="/legal" className="inline-block py-2.5 underline hover:text-slate-300">
              ข้อกำหนดการใช้งาน
            </Link>
          </nav>
        </footer>
        <MobileSupportBar>
          <MembershipSlot variant="bar" />
        </MobileSupportBar>
        <ServiceWorkerRegister />
        <SiteAnalytics />
      </body>
    </html>
  );
}
