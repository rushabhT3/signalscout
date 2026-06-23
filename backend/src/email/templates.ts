const WRAPPER_START =
  '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a2e;line-height:1.6">';
const WRAPPER_END =
  '<hr style="border:none;border-top:1px solid #ececf1;margin:28px 0 16px"/>' +
  '<p style="font-size:12px;color:#8a8aa3">SignalScout — buying signals from public hiring data.</p></div>';

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${label}</a>`;
}

export interface EmailContent {
  subject: string;
  html: string;
}

export function welcomeEmail(name: string | null, dashboardUrl: string): EmailContent {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return {
    subject: "Welcome to SignalScout 👋",
    html:
      WRAPPER_START +
      `<h1 style="font-size:22px;margin:0 0 12px">Welcome to SignalScout</h1>` +
      `<p>${greeting}</p>` +
      `<p>Create a tracker, point it at a few companies' job boards, and we'll surface the postings that match your buying-signal hypothesis — with an AI-drafted way in.</p>` +
      `<p style="margin:24px 0">${button(dashboardUrl, "Open your dashboard")}</p>` +
      WRAPPER_END,
  };
}

export function digestEmail(newMatches: number, dashboardUrl: string): EmailContent {
  const plural = newMatches === 1 ? "signal" : "signals";
  return {
    subject: `${newMatches} new buying ${plural} on SignalScout`,
    html:
      WRAPPER_START +
      `<h1 style="font-size:22px;margin:0 0 12px">${newMatches} new ${plural} matched</h1>` +
      `<p>Your trackers surfaced <strong>${newMatches}</strong> new matching ${plural} since the last run.</p>` +
      `<p style="margin:24px 0">${button(dashboardUrl, "Review your signals")}</p>` +
      WRAPPER_END,
  };
}
