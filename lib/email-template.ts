/**
 * Branded email wrapper for all MuscleGuard emails.
 * Obsidian card + lime CTA on surface background.
 */
export function brandedEmail({
  title,
  body,
  ctaText,
  ctaUrl,
  footer,
}: {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}): string {
  const ctaBlock = ctaText && ctaUrl
    ? `<tr><td style="padding:0 32px 32px;text-align:center;">
        <a href="${ctaUrl}" style="display:inline-block;padding:14px 40px;background-color:#CDFF00;color:#131413;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${ctaText}</a>
      </td></tr>`
    : "";

  const footerText = footer ?? "If you didn't expect this email, you can safely ignore it.";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
<tr><td style="background-color:#131413;border-radius:14px;overflow:hidden;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:32px 32px 24px;text-align:center;">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
    <td style="padding-right:8px;vertical-align:middle;">
      <img src="https://muscleguard.app/icon-shield.png" width="20" height="20" alt="" style="display:block;" onerror="this.style.display='none'">
    </td>
    <td style="vertical-align:middle;">
      <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">MuscleGuard</span>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:0 32px 32px;text-align:center;">
  <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#ffffff;">${title}</h1>
  <div style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">${body}</div>
</td></tr>
${ctaBlock}
<tr><td style="padding:0 32px;"><div style="height:1px;background-color:rgba(255,255,255,0.08);"></div></td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;">
  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.5;">${footerText}</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 0 0;text-align:center;">
  <p style="margin:0;font-size:11px;color:#BFC1C0;">MuscleGuard is a wellness tool designed to support GLP-1 users.<br>Not a medical device. Always consult your healthcare provider.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
