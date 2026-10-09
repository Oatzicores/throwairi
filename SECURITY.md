# ความปลอดภัย / Security

## แจ้งช่องโหว่ (Reporting a vulnerability)

**อย่าเปิด Issue สาธารณะสำหรับช่องโหว่** ให้แจ้งแบบส่วนตัวผ่าน GitHub:
แท็บ **Security** → **Report a vulnerability** (Private vulnerability reporting)

Please **do not open a public issue** for security problems. Use GitHub's private
reporting instead: **Security** tab → **Report a vulnerability**.

ข้อมูลที่ช่วยให้แก้ได้เร็ว: หน้าหรือ URL ที่เกิดปัญหา, ขั้นตอนทำซ้ำ, ผลกระทบที่คาดว่าจะเกิด

ขอบเขต: โค้ดใน repo นี้ และเว็บ https://throwairi.vercel.app
นอกขอบเขต: การโจมตีแบบ DoS / ยิงโหลด, การหลอกลวงทางสังคม (social engineering), เว็บของผู้ให้บริการ AI ที่เราลิงก์ไป

ห้ามทดสอบด้วยการยิงคำขอจำนวนมาก การเจาะระบบของ Vercel/GitHub หรือการเข้าถึงข้อมูลของผู้อื่น

## ช่องทางทางการ (Official channels)

- เว็บทางการมี **ที่เดียว**: https://throwairi.vercel.app
- ช่องทางบริจาคที่ถูกต้องมี **เฉพาะในหน้า `/support` ของเว็บทางการ** เท่านั้น
- ThrowAirI **ไม่เคย** ขอรหัสผ่าน, OTP, เลขบัตร หรือให้โอนเงินเพื่อเลื่อนอันดับ (อันดับไม่ได้ขาย: `docs/adr/0001-ranking-is-not-for-sale.md`)
- เว็บที่ fork โค้ดนี้ไปใช้ **ไม่ใช่ ThrowAirI** และต้องไม่ใช้ชื่อหรือโลโก้ ThrowAirI ถ้าพบเว็บที่แอบอ้าง แจ้งผ่านช่องทางด้านบน

## สิ่งที่ระบบป้องกันไว้แล้ว (What the code already guards)

| ความเสี่ยง | การป้องกัน | ไฟล์ |
|---|---|---|
| ฝังเว็บในกรอบเพื่อหลอกให้คลิก (clickjacking) | `frame-ancestors 'none'` + `X-Frame-Options: DENY` | `next.config.ts` |
| สคริปต์แปลกปลอม (XSS) | Content-Security-Policy ให้โหลดได้เฉพาะจากโดเมนตัวเอง, React escape ข้อความทุกจุด | `next.config.ts` |
| ลิงก์ `javascript:` จากฟีดข่าวภายนอก | รับเฉพาะลิงก์ `http(s)` | `src/lib/security/input.ts`, `src/lib/sources/news.ts` |
| URL ยาวผิดปกติ / พารามิเตอร์ซ้ำทำให้หน้าพัง | ตัดคำค้นที่ 500 ตัวอักษร, รับค่าแรกเมื่อพารามิเตอร์ซ้ำ | `src/lib/security/input.ts` |
| สแปมใส่ข้อความหลอกลวงใน URL ผลค้นหาแล้วให้ Google เก็บ | `/results` เป็น `noindex` และถูกห้ามใน `robots.txt` | `src/app/results/page.tsx`, `src/app/robots.ts` |
| ยิง API จนเปลืองโควตา | `/api/tools` เป็นไฟล์ static บน CDN ไม่เรียก server | `src/app/api/tools/route.ts` |
| คำค้นของผู้ใช้หลุดไปเว็บอื่น | `Referrer-Policy: strict-origin-when-cross-origin` และ Analytics ตัด query ทิ้ง | `next.config.ts`, `src/components/SiteAnalytics.tsx` |
| ข้อมูลส่วนตัวเจ้าของหลุดในรูป (ชื่อจริง, รหัสบัญชี Canva/Facebook) | เทสต์ล้มทันทีถ้ารูปไหนมีข้อมูลแฝง + สคริปต์ลบ | `src/lib/security/imageMetadata.test.ts`, `scripts/strip-image-metadata.ts` |
| เบอร์บริจาคติดไปกับโค้ดที่ถูก fork | เบอร์อยู่ใน env `DONATE_PHONE` ไม่อยู่ในโค้ด | `src/lib/donate.ts` |
| Action หรือ dependency ถูกแฮ็ก | GitHub Actions ปักหมุดด้วย commit SHA, token สิทธิ์อ่านอย่างเดียว, Dependabot | `.github/workflows/*.yml`, `.github/dependabot.yml` |

## กฎสำหรับผู้ร่วมพัฒนา (For contributors)

1. ห้าม commit ไฟล์ `.env*`, key, token หรือรหัสผ่านใด ๆ (`.gitignore` กันไว้แล้ว และ GitHub push protection จะบล็อก)
2. ลบข้อมูลแฝงในรูปทุกครั้งก่อน commit: `npx tsx scripts/strip-image-metadata.ts <ไฟล์>`
3. ห้ามเพิ่มสคริปต์หรือรูปจากโดเมนภายนอก ถ้าจำเป็นต้องแก้ CSP ใน `next.config.ts` พร้อมเหตุผลใน PR
4. ห้ามใช้ `dangerouslySetInnerHTML` กับข้อมูลที่มาจากภายนอก (ตอนนี้ใช้ที่เดียว คือ QR ที่ server วาดเองใน `/support`)
5. ลิงก์ออกนอกเว็บที่เปิดแท็บใหม่ต้องมี `rel="noopener noreferrer"`
