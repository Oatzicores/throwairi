# ThrowAirI

**พิมพ์งานที่อยากทำ → ได้ AI ที่เหมาะ พร้อมราคาเป็นบาท** · เว็บจริง: https://throwairi.vercel.app

*Describe your task in Thai or English and get ranked AI tools with prices converted to THB, commercial-use rights and sources. Built for Thai video, image and audio creators.*

- แคตตาล็อก 43 เครื่องมือ (แชท โค้ด ภาพ วิดีโอ เสียง เอเจนต์) ทุกตัวเลขมี `sourceUrl` + `lastVerified` ถ้าไม่มีแหล่งจริงจะขึ้น `unknown` แทนการเดา
- ราคา ≈ บาท, สิทธิ์เชิงพาณิชย์ต่อแผน, วันที่อัปเดตล่าสุด, ประวัติเวอร์ชัน, เปรียบเทียบข้างกัน
- **อันดับไม่ได้ขาย** คำนวณจากข้อมูลของเครื่องมือและคำขอเท่านั้น มีเทสต์บังคับ ([ADR 0001](docs/adr/0001-ranking-is-not-for-sale.md))
- ไม่ต้องสมัคร ไม่เก็บคำค้น Analytics ตัด query string ทิ้ง

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4

## รันในเครื่อง / Run locally

```bash
npm install
npm run dev     # http://localhost:3000
```

แก้ไฟล์ใน `data/` แล้วต้อง restart (แคตตาล็อกแคชในหน่วยความจำ)

## ช่วยตรวจข้อมูล / Contributing

เห็นราคาหรือข้อมูลผิด? เปิด Issue "แจ้งข้อมูลผิด" พร้อมลิงก์หน้าทางการของผู้ให้บริการ หรือส่ง PR ดู [CONTRIBUTING.md](CONTRIBUTING.md)

## โครงสร้าง

```
data/catalog/*.json     แคตตาล็อก แยกตามหมวด
data/prompts/*.json     ตัวอย่าง prompt หน้า /prompts
docs/                   กติกาข้อมูล (catalog-research-brief.md), ADR, ที่มาของโลโก้
src/lib/types/          schema (SourcedFact = value + confidence + source + date)
src/lib/match/          แยกเจตนาจาก prompt และคิดคะแนน 5 มิติ
src/lib/data/           โหลดและ validate แคตตาล็อก (ทิ้ง entry ที่ข้อมูลไม่ครบ)
src/app/                หน้าเว็บ: ค้นหา → ผลลัพธ์ → รายละเอียด → เปรียบเทียบ
```

ตรวจแคตตาล็อก: `npm run catalog:check` · ทดสอบ: `npm test`

## ตัวแปรสภาพแวดล้อม / Environment

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://throwairi.vercel.app` | URL หลักสำหรับ sitemap / metadata (ตั้งเป็นของคุณถ้า fork) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | ไม่ตั้ง | อีเมลรับแจ้งแก้ข้อมูลที่หน้า `/corrections` |
| `DONATE_PHONE` | ไม่ตั้ง (หน้า `/support` ขึ้นว่ายังไม่เปิดรับบริจาค) | เบอร์ PromptPay ของผู้ดูแลเว็บ **ห้ามเขียนลงโค้ด** |
| `NEXT_PUBLIC_AFFILIATE_ENABLED` | ปิด (ต้องเป็น `true`) | ลิงก์พันธมิตร ปิดไว้ตามนโยบาย |
| `NEXT_PUBLIC_MEMBERSHIP_ENABLED` | ปิด (ต้องเป็น `true`) | ปุ่มสมัครสมาชิก ยังไม่เปิด |

## ความปลอดภัย / Security

แจ้งช่องโหว่แบบส่วนตัวตาม [SECURITY.md](SECURITY.md) เว็บทางการมีที่เดียวคือ https://throwairi.vercel.app เว็บที่ fork ไปไม่ใช่ ThrowAirI

## ใบอนุญาต / License

- โค้ด: [MIT](LICENSE)
- ข้อมูลใน `data/`: [CC BY-NC 4.0](data/LICENSE) ให้เครดิต "ข้อมูลจาก ThrowAirI (throwairi.vercel.app)" ห้ามใช้เชิงพาณิชย์
- ชื่อ/โลโก้ ThrowAirI และโลโก้ผู้ให้บริการ AI ไม่อยู่ใต้ MIT ดู [NOTICE](NOTICE)

## สนับสนุน / Support

อ่านวิธีสนับสนุนที่ https://throwairi.vercel.app/support
