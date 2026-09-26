import { SITE_NAME } from "./site";

// Sender address stays on the current domain until the Resend domain migration.
const FROM = `${SITE_NAME} <noreply@muscleguard.app>`;

/** Send a transactional email via Resend. No-op if RESEND_API_KEY is unset. */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
}
