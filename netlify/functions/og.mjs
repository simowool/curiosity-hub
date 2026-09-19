export default async (req) => {
  const src = new URL("/og.b64", req.url);
  const b64 = (await (await fetch(src)).text()).trim();
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
