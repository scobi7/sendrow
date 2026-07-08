"use server";

const FROM = process.env.FROM_EMAIL ?? "hello@sendrow.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sendrow.app";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "malachi.nguyen@sendrow.app";

async function send(to: string | string[], subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: `Sendrow <${FROM}>`, to: Array.isArray(to) ? to : [to], subject, html }),
  });
}

export async function sendDemoRequest(name: string, email: string, company: string) {
  await send(
    ADMIN_EMAIL,
    `Demo request: ${name} at ${company}`,
    `<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Company:</strong> ${company}</p>`
  );
}

export async function sendWelcomeEmail(name: string, email: string) {
  const firstName = name.split(" ")[0];
  await send(
    email,
    "Welcome to Sendrow",
    `<p>Hi ${firstName},</p>
<p>Your Sendrow account is ready. Connect your <strong>QuickBooks</strong> and <strong>utility account</strong> first — those two do most of the work automatically.</p>
<p><a href="${APP_URL}/dashboard">Go to your dashboard →</a></p>
<p>— The Sendrow team</p>`
  );
}

export async function sendInviteAcceptedEmail(
  consultantName: string,
  consultantEmail: string,
  companyName: string,
  clientName: string,
  clientEmail: string
) {
  const firstName = consultantName.split(" ")[0];
  await send(
    consultantEmail,
    `${clientName} accepted your invite for ${companyName}`,
    `<p>Hi ${firstName},</p>
<p><strong>${clientName}</strong> (${clientEmail}) has accepted your invite and created their Sendrow account for <strong>${companyName}</strong>.</p>
<p>They can now log in and start filling in their data. You can track their progress from your dashboard.</p>
<p><a href="${APP_URL}/consultant">View your clients →</a></p>
<p>— The Sendrow team</p>`
  );
}

export async function sendAgencyQuoteRequest(data: {
  name: string;
  email: string;
  firm: string;
  title: string;
  teamSize: string;
  clientCount: string;
  workTypes: string[];
  frameworks: string[];
  currentTools: string;
  painPoint: string;
  timeline: string;
  source: string;
}) {
  await send(
    ADMIN_EMAIL,
    `Agency quote request: ${data.firm} (${data.name})`,
    `<h2>Agency Quote Request</h2>
<p><strong>Name:</strong> ${data.name}</p>
<p><strong>Email:</strong> ${data.email}</p>
<p><strong>Firm:</strong> ${data.firm}</p>
<p><strong>Title:</strong> ${data.title || "—"}</p>
<hr/>
<p><strong>Team size (consultants):</strong> ${data.teamSize}</p>
<p><strong>Active clients:</strong> ${data.clientCount}</p>
<p><strong>Work types:</strong> ${data.workTypes.join(", ") || "—"}</p>
<p><strong>Frameworks:</strong> ${data.frameworks.join(", ") || "—"}</p>
<hr/>
<p><strong>Current tools/process:</strong><br/>${data.currentTools || "—"}</p>
<p><strong>Biggest pain point:</strong><br/>${data.painPoint || "—"}</p>
<p><strong>Timeline:</strong> ${data.timeline}</p>
<p><strong>How they heard about us:</strong> ${data.source || "—"}</p>`
  );
}

export async function sendDataRequestEmail(
  clientEmail: string,
  clientName: string,
  companyName: string,
  description: string,
  dueDate: string | null
) {
  const firstName = clientName.split(" ")[0];
  await send(
    clientEmail,
    `New data request for ${companyName}`,
    `<p>Hi ${firstName},</p>
<p>Your reviewer has requested additional data for <strong>${companyName}</strong>:</p>
<blockquote><p>${description}</p></blockquote>
${dueDate ? `<p><strong>Due:</strong> ${dueDate}</p>` : ""}
<p><a href="${APP_URL}/intake/upload">Upload the data →</a></p>
<p>— The Sendrow team</p>`
  );
}

export async function sendUploadNeedsReviewEmail(
  consultantEmail: string,
  consultantName: string,
  companyName: string,
  filename: string,
  unmappedCount: number
) {
  const firstName = consultantName.split(" ")[0];
  await send(
    consultantEmail,
    `${companyName} uploaded a file that needs review`,
    `<p>Hi ${firstName},</p>
<p><strong>${companyName}</strong> uploaded <strong>${filename}</strong> and it was routed to your review queue.</p>
${unmappedCount > 0 ? `<p><strong>${unmappedCount}</strong> row${unmappedCount === 1 ? "" : "s"} could not be mapped to an emission factor and ${unmappedCount === 1 ? "is" : "are"} flagged for categorization.</p>` : ""}
<p><a href="${APP_URL}/consultant/clients">Review the upload →</a></p>
<p>— The Sendrow team</p>`
  );
}

export async function sendSectionCompleteEmail(
  consultantEmail: string,
  consultantName: string,
  companyName: string,
  sectionLabel: string
) {
  const firstName = consultantName.split(" ")[0];
  await send(
    consultantEmail,
    `${companyName} completed ${sectionLabel}`,
    `<p>Hi ${firstName},</p>
<p><strong>${companyName}</strong> just completed the <strong>${sectionLabel}</strong> section on Sendrow.</p>
<p><a href="${APP_URL}/consultant">View their progress →</a></p>
<p>— The Sendrow team</p>`
  );
}
