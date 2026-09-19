export default async () => {
  const sources = [
    "https://d.uguu.se/tUOweJrx.jpg",
    "https://tmpfiles.org/dl/wxwjN1ERaj0g/og-sm.jpg",
  ];
  for (const src of sources) {
    try {
      const res = await fetch(src, { redirect: "follow" });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") || "";
      if (!type.includes("image") && !type.includes("octet-stream")) continue;
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1000) continue;
      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=604800",
        },
      });
    } catch (err) {}
  }
  return new Response("og image unavailable", { status: 502 });
};

export const config = {
  path: "/og.jpg",
};
