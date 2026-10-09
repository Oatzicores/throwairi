"use client";

import { usePathname } from "next/navigation";
import { DonateButton } from "./DonateButton";

/** Fixed bottom bar on phones. Hidden on /support itself and from tablet width up (the header has the button). */
export function MobileSupportBar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/support") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t border-slate-800 bg-slate-950/90 px-4 py-2 backdrop-blur sm:hidden">
      <DonateButton variant="bar" />
      {children}
    </div>
  );
}
