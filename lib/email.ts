"use server";

const FROM = process.env.FROM_EMAIL ?? "hello@greentrack.app";

export async function sendWelcomeEmail(name: string, email: string) {
  if (!process.env.RESEND_API_KEY) return; // silently skip in dev

  const firstName = name.split(" ")[0];
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `GreenTrack <${FROM}>`,
      to: [email],
      subject: "Welcome to GreenTrack",
      html: `<p>Hi ${firstName},</p>
<p>Your GreenTrack account is ready. Connect your <strong>QuickBooks</strong> and <strong>utility account</strong> first — those two do most of the work automatically.</p>
<p><a href="https://greentrack.app/dashboard">Go to your dashboard →</a></p>
<p>— The GreenTrack team</p>`,
    }),
  });
}
