export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const rawBody = await readRawBody(req);
  const params = new URLSearchParams(rawBody);

  const body = params.get("Body") || "";

  const vapiResp = await fetch("https://api.vapi.ai/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId: "0260235a-864c-4cbd-a0c2-f5f28447170b",
      input: body,
    }),
  });

  const vapiJson = await vapiResp.json();

  const replyText =
    vapiResp.ok
      ? ((vapiJson.output || [])
          .filter((m) => m.role === "assistant")
          .map((m) => m.content)
          .join("\n")
          .trim() || "Sorry — can you repeat that?")
      : "Sorry — something went wrong. Please try again.";

  res.setHeader("Content-Type", "text/xml");
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(replyText)}</Message>
</Response>`);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function escapeXml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}