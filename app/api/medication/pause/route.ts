import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyEmailAction } from "@/lib/email-token";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click "I paused my medication" link from the dose reminder email.
 * Authenticated by the HMAC in the URL, not by a session — the user clicks
 * this straight from their inbox.
 */
function page(title: string, message: string, appUrl: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${title} · Stoova</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
<tr><td style="background-color:#131413;border-radius:14px;padding:40px 32px;text-align:center;">
  <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;margin-bottom:24px;">Stoova</div>
  <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#ffffff;">${title}</h1>
  <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">${message}</p>
  <a href="${appUrl}/medication" style="display:inline-block;padding:14px 40px;background-color:#CDFF00;color:#131413;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Open Stoova</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  const appUrl = SITE_URL;
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const exp = Number(req.nextUrl.searchParams.get("exp") ?? "");

  if (!uid || !verifyEmailAction(uid, "pause", exp, token)) {
    return page(
      "This link isn't valid",
      "It may have expired or been copied incorrectly. You can update your medication status directly in the app.",
      appUrl
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ glp1_paused: true, updated_at: new Date().toISOString() })
    .eq("id", uid);

  if (error) {
    return page(
      "Something went wrong",
      "We couldn't update your medication status. Please try again from the app.",
      appUrl
    );
  }

  return page(
    "Reminders paused",
    "We've stopped your dose reminders. Whenever you log a dose again, they'll turn back on automatically.",
    appUrl
  );
}
