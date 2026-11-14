"use server";

const FROM = process.env.FROM_EMAIL ?? "hello@sendrow.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sendrow.app";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "malachi.nguyen@sendrow.app";

// Free-text notes (e.g. a CFO's message to a site contact) can come from an
// unauthenticated portal-token holder, so they're escaped before going into HTML.
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Sends via Resend. Returns false when the send definitively failed (no key,
 *  rejected by Resend, network error) so callers can record it - a silent
 *  drop here is a consultant waiting on a reply that never went out. */
async function send(
  to: string | string[],
  subject: string,
  html: string,
  opts?: { fromName?: string; replyTo?: string | null }
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error(`email not sent (no RESEND_API_KEY): "${subject}"`);
    return false;
  }
  // Client-facing sends use the consultant's brand as the display name (§11);
  // the address stays on our domain until custom sending domains land.
  const fromName = opts?.fromName ?? "Sendrow";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${FROM}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(opts?.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`email rejected (${res.status}): "${subject}": ${await res.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`email send error: "${subject}"`, e);
    return false;
  }
}

export async function sendDemoRequest(name: string, email: string, company: string) {
  await send(
    ADMIN_EMAIL,
    `Demo request: ${name} at ${company}`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Name:</strong> ${name}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Email:</strong> ${email}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Company:</strong> ${company}</p>`
  );
}

export async function sendWelcomeEmail(name: string, email: string) {
  const firstName = name.split(" ")[0];
  await send(
    email,
    "Welcome to Sendrow",
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${firstName},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Your Sendrow workspace is ready. Add your first client and send them a data request. They get a secure link, no account needed.</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/consultant">Go to your workspace</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">The Sendrow team</p>`
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
    `<h2 style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Agency Quote Request</h2>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Name:</strong> ${data.name}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Email:</strong> ${data.email}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Firm:</strong> ${data.firm}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Title:</strong> ${data.title || "None"}</p>
<hr/>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Team size (consultants):</strong> ${data.teamSize}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Active clients:</strong> ${data.clientCount}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Work types:</strong> ${data.workTypes.join(", ") || "None"}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Frameworks:</strong> ${data.frameworks.join(", ") || "None"}</p>
<hr/>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Current tools/process:</strong><br/>${data.currentTools || "None"}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Biggest pain point:</strong><br/>${data.painPoint || "None"}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Timeline:</strong> ${data.timeline}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>How they heard about us:</strong> ${data.source || "None"}</p>`
  );
}

export async function sendDataRequestEmail(
  clientEmail: string | string[],
  clientName: string,
  companyName: string,
  description: string,
  dueDate: string | null,
  portalToken: string,
  brand?: { brandName: string; replyTo: string | null } | null,
  message?: string | null
): Promise<boolean> {
  const firstName = clientName.split(" ")[0];
  const link = `${APP_URL}/portal/${portalToken}`;
  return send(
    clientEmail,
    `New data request for ${companyName}`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${firstName},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Your reviewer has requested additional data for <strong>${companyName}</strong>:</p>
<blockquote style="margin:0 0 16px;padding-left:12px;border-left:3px solid #C8DCCF;color:#3D5A4C"><p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${description}</p></blockquote>
${dueDate ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Due:</strong> ${dueDate}</p>` : ""}
${message ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><em>"${escapeHtml(message)}"</em></p>` : ""}
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${link}">Open your secure upload link</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">No account or password needed. The link is unique to you.</p>
${brand ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

export async function sendReferralLeadEmail(data: { name: string; email: string; company: string; trigger: string }) {
  await send(
    ADMIN_EMAIL,
    `Referral lead: ${data.company} (${data.name})`,
    `<h2 style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">New consultant-match request</h2>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Name:</strong> ${data.name}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Email:</strong> ${data.email}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>Company:</strong> ${data.company}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>What triggered the need:</strong><br/>${data.trigger || "None"}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Route to a partner consultant and log the outcome.</p>`
  );
}

export async function sendPortalReminderEmail(
  clientEmail: string | string[],
  clientName: string,
  companyName: string,
  description: string,
  portalToken: string,
  reminder: { tier: string; daysUntilDue: number | null },
  ccConsultant: string | null,
  brand?: { brandName: string; replyTo: string | null } | null
) {
  const firstName = clientName.split(" ")[0];
  const recipients = Array.isArray(clientEmail) ? clientEmail : [clientEmail];
  const to = ccConsultant ? [...recipients, ccConsultant] : recipients;
  const urgency =
    reminder.tier === "overdue"
      ? "This is now past due. Sending it today keeps everything on track."
      : reminder.tier === "due-0"
        ? "It's due today."
        : reminder.daysUntilDue !== null
          ? `It's due in ${reminder.daysUntilDue} day${reminder.daysUntilDue === 1 ? "" : "s"}.`
          : "A quick reminder: this is still waiting on you.";
  await send(
    to,
    reminder.tier === "overdue"
      ? `Past due: data needed for ${companyName}`
      : `Reminder: data still needed for ${companyName}`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${firstName},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Your reviewer is still waiting on data for <strong>${companyName}</strong>. ${urgency}</p>
<blockquote style="margin:0 0 16px;padding-left:12px;border-left:3px solid #C8DCCF;color:#3D5A4C"><p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${description}</p></blockquote>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/portal/${portalToken}">Open your secure upload link</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">It usually takes a few minutes. No account or password needed.</p>
${brand ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

export async function sendSubmissionEmail(
  consultantEmail: string,
  consultantName: string,
  companyName: string,
  filename: string,
  imported: number,
  unmapped: number,
  companyId: string,
  autoApproved: boolean
) {
  const firstName = consultantName.split(" ")[0];
  await send(
    consultantEmail,
    `${companyName} just submitted data`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${firstName},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>${companyName}</strong> submitted <strong>${filename}</strong>: ${imported} row${imported === 1 ? "" : "s"}${unmapped > 0 ? `, ${unmapped} flagged for your review` : ""}.</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${autoApproved ? "It auto-processed (mapping was confirmed by the uploader)." : "It's waiting in your review queue."}</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/consultant/clients/${companyId}">Open the client</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">The Sendrow team</p>`
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
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${firstName},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>${companyName}</strong> uploaded <strong>${filename}</strong> and it was routed to your review queue.</p>
${unmappedCount > 0 ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>${unmappedCount}</strong> row${unmappedCount === 1 ? "" : "s"} could not be mapped to an emission factor and ${unmappedCount === 1 ? "is" : "are"} flagged for categorization.</p>` : ""}
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/consultant">Open your dashboard</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">The Sendrow team</p>`
  );
}


export async function sendRestatementEmail(
  to: string,
  companyName: string,
  snapshotLabel: string,
  changes: { label: string; previous: number; current: number; pct: number | null }[],
  newLink: string | null,
  brand?: { brandName: string; replyTo: string | null } | null
): Promise<boolean> {
  const rows = changes
    .map(
      (c) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#0D2A1E">${c.label}</td><td style="padding:4px 12px;color:#0D2A1E">${c.previous.toLocaleString("en-US", { maximumFractionDigits: 2 })} t</td><td style="padding:4px 12px;color:#0D2A1E">${c.current.toLocaleString("en-US", { maximumFractionDigits: 2 })} t</td><td style="padding:4px 0;color:#0D2A1E">${c.pct === null ? "n/a" : `${c.pct > 0 ? "+" : ""}${c.pct.toFixed(1)}%`}</td></tr>`
    )
    .join("");
  return send(
    to,
    `Restatement: updated emissions data for ${companyName}`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hello,</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Emissions data previously shared with you for <strong>${companyName}</strong> (&ldquo;${snapshotLabel}&rdquo;) has been corrected. Here is exactly what changed:</p>
<table style="border-collapse:collapse;font-size:14px;font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><tr><th align="left" style="padding:4px 12px 4px 0;color:#0D2A1E">Figure</th><th align="left" style="padding:4px 12px;color:#0D2A1E">Previous</th><th align="left" style="padding:4px 12px;color:#0D2A1E">Corrected</th><th align="left" style="color:#0D2A1E">Change</th></tr>${rows}</table>
${newLink ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${newLink}">View the corrected version</a></p>` : ""}
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">The previous version remains on record; nothing was silently changed.</p>
${brand ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

/** A consultant shared one frozen snapshot with a named recipient. The link
 *  opens the read-only shared page; the recipient needs no account. */
export async function sendSnapshotShareEmail(
  to: string,
  companyName: string,
  snapshotLabel: string,
  period: string | null,
  frozenOn: string,
  token: string,
  brand?: { brandName: string; replyTo: string | null } | null
): Promise<boolean> {
  const sharedBy = brand?.brandName ?? "Your consultant";
  return send(
    to,
    `${sharedBy} shared emissions data for ${companyName}`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hello,</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${escapeHtml(sharedBy)} has shared the emissions snapshot &ldquo;${escapeHtml(snapshotLabel)}&rdquo; for <strong>${escapeHtml(companyName)}</strong>${period ? ` (period: ${escapeHtml(period)})` : ""}. It was frozen on ${escapeHtml(frozenOn)}.</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/shared/${token}">View the shared snapshot</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">The page is view only and needs no account or password. It shows the figures exactly as they were frozen.</p>
${brand ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${escapeHtml(brand.brandName)}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

export async function sendClientStuckEmail(
  consultantEmail: string,
  consultantName: string,
  companyName: string,
  itemLabel: string,
  message: string,
  companyId: string
) {
  const firstName = consultantName.split(" ")[0];
  await send(
    consultantEmail,
    `${companyName} needs help with "${itemLabel}"`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${firstName},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>${companyName}</strong> hit a wall on the portal item <strong>&ldquo;${itemLabel}&rdquo;</strong> and asked for your help:</p>
<blockquote style="margin:0 0 16px;padding-left:12px;border-left:3px solid #C8DCCF;color:#3D5A4C"><p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${message}</p></blockquote>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">A quick reply usually keeps the response moving.</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/consultant/clients/${companyId}">Reply from the client page</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">The Sendrow team</p>`
  );
}

export async function sendNewLinkRequestEmail(
  consultantEmail: string,
  consultantName: string,
  companyName: string,
  requestDescription: string,
  companyId: string
) {
  await send(
    consultantEmail,
    `${companyName} needs a new upload link`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${consultantName.split(" ")[0]},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>${companyName}</strong> tried to open an expired upload link for the request
&ldquo;${requestDescription}&rdquo; and asked for a new one.</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/consultant/clients/${companyId}">Open the client</a>. The &ldquo;Renew link&rdquo; button is on the request.</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">The Sendrow team</p>`
  );
}

/** Consultant answered a supplier's "I'm stuck" flag (X2) - the reply lives on
 *  the portal thread, so the email carries the link back there. */
export async function sendFlagReplyEmail(
  clientEmail: string,
  clientName: string,
  itemLabel: string,
  body: string,
  portalToken: string,
  brand?: { brandName: string; replyTo: string | null } | null
): Promise<boolean> {
  return send(
    clientEmail,
    `Reply about “${itemLabel}”`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${clientName.split(" ")[0]},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">You asked about <strong>${itemLabel}</strong>. Your reviewer replied:</p>
<blockquote style="margin:0 0 16px;padding-left:12px;border-left:3px solid #C8DCCF;color:#3D5A4C"><p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${body}</p></blockquote>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/portal/${portalToken}">Open your secure upload link to continue</a></p>
${brand ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

/** The reviewer sent one or more uploads back with a note. One email per action
 *  (Request changes, or a single flag), listing each upload and its note. */
export async function sendChangesRequestedEmail(
  clientEmail: string,
  clientName: string,
  companyName: string,
  items: { filename: string; note: string }[],
  portalToken: string,
  brand?: { brandName: string; replyTo: string | null } | null
): Promise<boolean> {
  const blocks = items
    .map(
      (i) => `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><strong>${escapeHtml(i.filename)}</strong></p>
<blockquote style="margin:0 0 16px;padding-left:12px;border-left:3px solid #C8DCCF;color:#3D5A4C"><p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${escapeHtml(i.note)}</p></blockquote>`
    )
    .join("\n");
  return send(
    clientEmail,
    `Changes requested for ${companyName} data`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${escapeHtml(clientName.split(" ")[0])},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Your reviewer has asked for changes to the data you sent for <strong>${escapeHtml(companyName)}</strong>:</p>
${blocks}
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${APP_URL}/portal/${portalToken}">Open your secure page to upload corrected files</a></p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">No account or password needed. The link is unique to you.</p>
${brand ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${escapeHtml(brand.brandName)}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

export async function sendCommentEmail(
  clientEmail: string,
  clientName: string,
  companyName: string,
  lineLabel: string,
  body: string,
  portalToken: string | null,
  brand?: { brandName: string; replyTo: string | null } | null
): Promise<boolean> {
  // Link to the portal (Z2) so the supplier can answer without an account -
  // "reply to this email" was a dead end (no inbound email handling).
  const link = portalToken ? `${APP_URL}/portal/${portalToken}` : null;
  return send(
    clientEmail,
    `Question about your ${companyName} data`,
    `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Hi ${clientName.split(" ")[0]},</p>
<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">Your reviewer has a question about <strong>${lineLabel}</strong>:</p>
<blockquote style="margin:0 0 16px;padding-left:12px;border-left:3px solid #C8DCCF;color:#3D5A4C"><p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${body}</p></blockquote>
${link ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E"><a style="color:#0A7346" href="${link}">Open your secure page to answer</a></p>` : "<p style='font-family:Archivo,Arial,sans-serif;color:#0D2A1E'>Your consultant will follow up.</p>"}
${brand ? `<p style="font-family:Archivo,Arial,sans-serif;color:#0D2A1E">${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}
