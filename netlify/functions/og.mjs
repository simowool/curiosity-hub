export default async (req) => {
  const names = ["og1", "og2", "og3", "og4", "og5", "og6", "og7"];
  const parts = await Promise.all(
    names.map((name) => fetch(new URL("/" + name + ".b64", req.url)).then((r) => {
      if (!r.ok) throw new Error(name + " " + r.status);
      return r.text();
    }))
  );
  const b64 = parts.map((t) => t.trim()).join("");
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Response(binary, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = {
  path: "/og.jpg",
};
