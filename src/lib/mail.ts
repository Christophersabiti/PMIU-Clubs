import "server-only";
import { db } from "./db";
import { appUrl } from "./utils";

type Mail = { to: string; subject: string; heading: string; body: string; cta?: { label: string; href: string }; template: string };

function layout({ heading, body, cta }: Pick<Mail, "heading" | "body" | "cta">) {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${appUrl(cta.href)}" style="background:#6d28d9;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${cta.label}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1e1033">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#fff;padding:20px 28px;border-bottom:4px solid #5f23bd"><img src="${appUrl("/brand/pmi-uganda-logo.png")}" alt="Project Management Institute Uganda" width="140" style="display:block;height:auto"><div style="margin-top:6px;font-size:12px;font-weight:700;letter-spacing:2px;color:#5f23bd">CLUBS</div></td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
<div style="font-size:15px;line-height:1.6">${body}</div>${button}
<p style="font-size:12px;color:#6b5b8a;margin-top:32px">Connect. Participate. Grow. Impact.<br>You are receiving this because you have an account on PMI Uganda Clubs. Manage email preferences in your profile.</p>
</td></tr></table></td></tr></table></body></html>`;
}

/**
 * Sends through Resend when RESEND_API_KEY is configured; otherwise the message is stored
 * in the outbox (Admin › Communications) so flows can be tested without an email provider.
 */
export async function sendMail(mail: Mail) {
  const html = layout(mail);
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await db.emailLog.create({ data: { to: mail.to, subject: mail.subject, html, template: mail.template, status: "LOGGED" } });
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "PMI Uganda Clubs <onboarding@resend.dev>", to: mail.to, subject: mail.subject, html }),
    });
    const ok = res.ok;
    await db.emailLog.create({
      data: { to: mail.to, subject: mail.subject, html, template: mail.template, status: ok ? "SENT" : "FAILED", error: ok ? null : (await res.text()).slice(0, 500) },
    });
  } catch (err) {
    await db.emailLog.create({ data: { to: mail.to, subject: mail.subject, html, template: mail.template, status: "FAILED", error: String(err).slice(0, 500) } });
  }
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
