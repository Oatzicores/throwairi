import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ThrowAirI — หา AI ที่ใช่ จาก Prompt เดียว",
    short_name: "ThrowAirI",
    description:
      "พิมพ์ Prompt เดียว ได้ลิสต์ AI ทั่วโลกเรียงตามความเหมาะสม พร้อมเหตุผล ราคา และรีวิวจากแหล่งข้อมูลจริง",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#7c3aed",
    lang: "th",
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
