"use server";

const FROM = process.env.FROM_EMAIL ?? "hello@sendrow.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sendrow.app";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "malachi.nguyen@sendrow.app";

/** Sends via Resend. Returns false when the send definitively failed (no key,
 *  rejected by Resend, network error) so callers can record it — a silent
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
      console.error(`email rejected (${res.status}): "${subject}" — ${await res.text().catch(() => "")}`);
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
<p>Your Sendrow workspace is ready. Add your first client and send them a data request — they get a secure link, no account needed.</p>
<p><a href="${APP_URL}/consultant">Go to your workspace →</a></p>
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
  dueDate: string | null,
  portalToken: string,
  brand?: { brandName: string; replyTo: string | null } | null
): Promise<boolean> {
  const firstName = clientName.split(" ")[0];
  const link = `${APP_URL}/portal/${portalToken}`;
  return send(
    clientEmail,
    `New data request for ${companyName}`,
    `<p>Hi ${firstName},</p>
<p>Your reviewer has requested additional data for <strong>${companyName}</strong>:</p>
<blockquote><p>${description}</p></blockquote>
${dueDate ? `<p><strong>Due:</strong> ${dueDate}</p>` : ""}
<p><a href="${link}">Open your secure upload link →</a></p>
<p>No account or password needed — the link is unique to you.</p>
${brand ? `<p>— ${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

export async function sendReferralLeadEmail(data: { name: string; email: string; company: string; trigger: string }) {
  await send(
    ADMIN_EMAIL,
    `Referral lead: ${data.company} (${data.name})`,
    `<h2>New consultant-match request</h2>
<p><strong>Name:</strong> ${data.name}</p>
<p><strong>Email:</strong> ${data.email}</p>
<p><strong>Company:</strong> ${data.company}</p>
<p><strong>What triggered the need:</strong><br/>${data.trigger || "—"}</p>
<p>Route to a partner consultant and log the outcome.</p>`
  );
}

export async function sendPortalReminderEmail(
  clientEmail: string,
  clientName: string,
  companyName: string,
  description: string,
  portalToken: string,
  reminder: { tier: string; daysUntilDue: number | null },
  ccConsultant: string | null,
  brand?: { brandName: string; replyTo: string | null } | null
) {
  const firstName = clientName.split(" ")[0];
  const to = ccConsultant ? [clientEmail, ccConsultant] : clientEmail;
  const urgency =
    reminder.tier === "overdue"
      ? "This is now past due — a few minutes today keeps everything on track."
      : reminder.tier === "due-0"
        ? "It's due today."
        : reminder.daysUntilDue !== null
          ? `It's due in ${reminder.daysUntilDue} day${reminder.daysUntilDue === 1 ? "" : "s"}.`
          : "A quick reminder — this is still waiting on you.";
  await send(
    to,
    reminder.tier === "overdue"
      ? `Past due: data needed for ${companyName}`
      : `Reminder: data still needed for ${companyName}`,
    `<p>Hi ${firstName},</p>
<p>Your reviewer is still waiting on data for <strong>${companyName}</strong>. ${urgency}</p>
<blockquote><p>${description}</p></blockquote>
<p><a href="${APP_URL}/portal/${portalToken}">Open your secure upload link →</a></p>
<p>It usually takes just a few minutes. No account or password needed.</p>
${brand ? `<p>— ${brand.brandName}</p>` : ""}`,
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
    `<p>Hi ${firstName},</p>
<p><strong>${companyName}</strong> submitted <strong>${filename}</strong> — ${imported} row${imported === 1 ? "" : "s"}${unmapped > 0 ? `, ${unmapped} flagged for your review` : ""}.</p>
<p>${autoApproved ? "It auto-processed (mapping was confirmed by the uploader)." : "It's waiting in your review queue."}</p>
<p><a href="${APP_URL}/consultant/clients/${companyId}">Open the client →</a></p>
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
<p><a href="${APP_URL}/consultant/review">Review the upload →</a></p>
<p>— The Sendrow team</p>`
  );
}


export async function sendRestatementEmail(
  to: string,
  companyName: string,
  snapshotLabel: string,
  changes: { label: string; previous: number; current: number; pct: number | null }[],
  newLink: string | null,
  brand?: { brandName: string; replyTo: string | null } | null
) {
  const rows = changes
    .map(
      (c) =>
        `<tr><td style="padding:4px 12px 4px 0">${c.label}</td><td style="padding:4px 12px">${c.previous.toLocaleString("en-US", { maximumFractionDigits: 2 })} t</td><td style="padding:4px 12px">${c.current.toLocaleString("en-US", { maximumFractionDigits: 2 })} t</td><td style="padding:4px 0">${c.pct === null ? "—" : `${c.pct > 0 ? "+" : ""}${c.pct.toFixed(1)}%`}</td></tr>`
    )
    .join("");
  await send(
    to,
    `Restatement: updated emissions data for ${companyName}`,
    `<p>Hello,</p>
<p>Emissions data previously shared with you for <strong>${companyName}</strong> (&ldquo;${snapshotLabel}&rdquo;) has been corrected. Here is exactly what changed:</p>
<table style="border-collapse:collapse;font-size:14px"><tr><th align="left" style="padding:4px 12px 4px 0">Figure</th><th align="left" style="padding:4px 12px">Previous</th><th align="left" style="padding:4px 12px">Corrected</th><th align="left">Change</th></tr>${rows}</table>
${newLink ? `<p><a href="${newLink}">View the corrected version →</a></p>` : ""}
<p>The previous version remains on record; nothing was silently changed.</p>
${brand ? `<p>— ${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

export async function sendClientStuckEmail(
  consultantEmail: string,
  consultantName: string,
  companyName: string,
  itemLabel: string,
  message: string
) {
  const firstName = consultantName.split(" ")[0];
  await send(
    consultantEmail,
    `${companyName} needs help with "${itemLabel}"`,
    `<p>Hi ${firstName},</p>
<p><strong>${companyName}</strong> hit a wall on the portal item <strong>&ldquo;${itemLabel}&rdquo;</strong> and asked for your help:</p>
<blockquote><p>${message}</p></blockquote>
<p>A quick reply usually keeps the response moving — stuck items are where portals lose people.</p>
<p><a href="${APP_URL}/consultant/review">Open your review queue →</a></p>
<p>— The Sendrow team</p>`
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
    `<p>Hi ${consultantName.split(" ")[0]},</p>
<p><strong>${companyName}</strong> tried to open an expired upload link for the request
&ldquo;${requestDescription}&rdquo; and asked for a new one.</p>
<p><a href="${APP_URL}/consultant/clients/${companyId}">Open the client — the &ldquo;Renew link&rdquo; button is on the request →</a></p>
<p>— The Sendrow team</p>`
  );
}

/** Consultant answered a supplier's "I'm stuck" flag (X2) — the reply lives on
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
    `<p>Hi ${clientName.split(" ")[0]},</p>
<p>You asked about <strong>${itemLabel}</strong> — here's the answer:</p>
<blockquote><p>${body}</p></blockquote>
<p><a href="${APP_URL}/portal/${portalToken}">Open your secure upload link to continue →</a></p>
${brand ? `<p>— ${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}

export async function sendCommentEmail(
  clientEmail: string,
  clientName: string,
  companyName: string,
  lineLabel: string,
  body: string,
  brand?: { brandName: string; replyTo: string | null } | null
) {
  await send(
    clientEmail,
    `Question about your ${companyName} data`,
    `<p>Hi ${clientName.split(" ")[0]},</p>
<p>Your reviewer left a note on <strong>${lineLabel}</strong>:</p>
<blockquote><p>${body}</p></blockquote>
<p>You can reply to this email directly.</p>
${brand ? `<p>— ${brand.brandName}</p>` : ""}`,
    brand ? { fromName: brand.brandName, replyTo: brand.replyTo } : undefined
  );
}
