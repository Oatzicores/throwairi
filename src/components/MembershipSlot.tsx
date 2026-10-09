import Link from "next/link";

/**
 * Reserved place for ThrowAirI's own paid membership. Renders nothing until
 * NEXT_PUBLIC_MEMBERSHIP_ENABLED is exactly "true". Do NOT switch it on before the site is on
 * Vercel Pro (receiving subscription payments is commercial use, forbidden on Hobby), the /membership
 * page exists and the legal page covers it.
 */
export const isMembershipEnabled = (): boolean => process.env.NEXT_PUBLIC_MEMBERSHIP_ENABLED === "true";

export function MembershipSlot({ variant = "header" }: { variant?: "header" | "bar" }) {
  if (!isMembershipEnabled()) return null;
  const size = variant === "bar" ? "min-h-[44px] px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs";
  return (
    <Link
      href="/membership"
      className={`inline-flex items-center justify-center rounded-full border border-violet-400/60 bg-violet-600/20 font-medium text-violet-100 transition hover:bg-violet-600/30 ${size}`}
    >
      สมัครสมาชิก
    </Link>
  );
}
