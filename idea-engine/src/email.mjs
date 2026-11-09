export async function sendEmail({ subject, html, text }) {
  const { RESEND_API_KEY: key, EMAIL_TO: to, RESEND_FROM: from = "SaaS Ideas <onboarding@resend.dev>" } = process.env;
  if (!key || !to) throw new Error("RESEND_API_KEY and EMAIL_TO must be set to send email");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject, html, text }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}
