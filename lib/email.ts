import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || 'StudyAI <noreply@studyai.app>'
const SITE_URL = 'https://study-assistant-ashy.vercel.app'

async function send(to: string, subject: string, html: string) {
  if (!resend) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch {
    // Email failures are non-fatal — app continues normally
  }
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>StudyAI</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;padding:28px 32px;text-align:center;">
            <span style="font-size:32px;">🎓</span>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">StudyAI</h1>
            <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Your AI Study Assistant</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              StudyAI · <a href="${SITE_URL}" style="color:#3b82f6;text-decoration:none;">${SITE_URL.replace('https://', '')}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendRegistrationEmail(to: string, name: string) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Registration Received! ⏳</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>, your StudyAI account request is received.</p>
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#854d0e;font-size:14px;line-height:1.6;">
        <strong>What happens next?</strong><br>
        The admin will review and activate your account — usually within a few hours. You'll get another email the moment it's ready.
      </p>
    </div>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
      Want to speed things up? Send a quick WhatsApp message to the admin:
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://wa.me/9647754822210?text=${encodeURIComponent(`Hi! I just registered for StudyAI.\nName: ${name}\nEmail: ${to}\nPlease activate my account. Thank you!`)}"
         style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
        📱 Message Admin on WhatsApp
      </a>
    </div>
  `)
  await send(to, 'Your StudyAI registration is received ⏳', html)
}

export async function sendActivationEmail(to: string, name: string) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">Your account is active! 🎉</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>, your StudyAI account has been activated. You can now sign in and start studying!</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;color:#166534;font-size:13px;font-weight:600;">YOUR LOGIN DETAILS</p>
      <p style="margin:0;color:#15803d;font-size:14px;line-height:1.8;">
        🌐 <strong>Website:</strong> <a href="${SITE_URL}/login" style="color:#16a34a;">${SITE_URL.replace('https://', '')}/login</a><br>
        📧 <strong>Email:</strong> ${to}
      </p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}/login"
         style="display:inline-block;background:#1d4ed8;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
        Go to My Dashboard →
      </a>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;text-align:center;">
      Upload a photo of any textbook page to get your first AI study plan. 📚
    </p>
  `)
  await send(to, 'Your StudyAI account is now active! 🎉', html)
}

export async function sendProExpiryReminderEmail(to: string, name: string, daysLeft: number, expiryDate: string) {
  const urgency = daysLeft <= 1 ? '🚨 Urgent' : '⚠️ Reminder'
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">${urgency}: Pro expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">Hi <strong>${name}</strong>, your Pro plan is expiring soon.</p>
    <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.8;">
        📅 <strong>Expiry date:</strong> ${expiryDate}<br>
        ⏰ <strong>Days remaining:</strong> ${daysLeft} day${daysLeft !== 1 ? 's' : ''}<br><br>
        After expiry, your account will revert to the <strong>Free plan</strong> (2 uploads/day).
      </p>
    </div>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
      Contact the admin on WhatsApp to renew your Pro subscription before it expires:
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://wa.me/9647754822210?text=${encodeURIComponent(`Hi! My StudyAI Pro subscription expires in ${daysLeft} day(s) (${expiryDate}).\nEmail: ${to}\nPlease help me renew. Thank you!`)}"
         style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
        📱 Renew via WhatsApp
      </a>
    </div>
  `)
  await send(to, `${urgency}: Your StudyAI Pro expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, html)
}
