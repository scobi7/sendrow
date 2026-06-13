"use server";

const FROM = process.env.FROM_EMAIL ?? "hello@greentrack.app";

async function send(to: string, toName: string, subject: string, text: string, html: string) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return; // silently skip in dev — set SENDGRID_API_KEY to enable

  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name: toName }] }],
      from: { email: FROM, name: "GreenTrack" },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });
}

export async function sendWelcomeEmail(name: string, email: string) {
  const firstName = name.split(" ")[0];
  await send(
    email,
    name,
    "Welcome to GreenTrack",
    `Hi ${firstName},\n\nYour account is ready. Connect your QuickBooks and utility accounts to get started — those two connections do most of the work.\n\nDashboard: https://greentrack.app/dashboard\n\nThe GreenTrack team`,
    `<p>Hi ${firstName},</p>
<p>Your GreenTrack account is ready.</p>
<p>Connect your <strong>QuickBooks</strong> and <strong>utility account</strong> to get started — those two connections do most of the heavy lifting.</p>
<p><a href="https://greentrack.app/dashboard">Go to your dashboard →</a></p>
<p>— The GreenTrack team</p>`,
  );
}
