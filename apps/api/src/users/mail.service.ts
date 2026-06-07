import { Injectable, Logger } from '@nestjs/common';

/**
 * Lightweight mail service using the Resend REST API.
 * No npm package required — uses the native fetch() available in Node 18+.
 * Falls back silently if RESEND_API_KEY is not set.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly fromAddress = 'CuriousBees <notifications@curiousbees.srmist.edu.in>';
  private readonly adminEmail =
    process.env.MAIN_ADMIN_EMAIL || 'mr9820@srmist.edu.in';

  async sendSupervisorRegistrationAlert(supervisor: {
    name: string;
    email: string;
    department: string;
    employeeId: string;
  }) {
    if (!this.apiKey) {
      this.logger.warn(
        '[MailService] RESEND_API_KEY not set — skipping admin email notification.',
      );
      return;
    }

    const adminDashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/approval-requests`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Supervisor Registration</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🐝 CuriousBees</span>
                    </div>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;font-weight:500;">SRMIST Research Collaboration Platform</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">New Supervisor Request</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                A faculty member has submitted a registration request to join CuriousBees as a <strong>Research Supervisor</strong>. Please review and approve or reject their application from the admin dashboard.
              </p>

              <!-- Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Full Name</span><br/>
                          <span style="font-size:15px;font-weight:600;color:#111827;">${supervisor.name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Email Address</span><br/>
                          <span style="font-size:15px;font-weight:600;color:#2563eb;">${supervisor.email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                          <span style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Department</span><br/>
                          <span style="font-size:15px;font-weight:600;color:#111827;">${supervisor.department}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Employee ID</span><br/>
                          <span style="font-size:15px;font-weight:600;color:#111827;font-family:monospace;">${supervisor.employeeId}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${adminDashboardUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.02em;">
                      Review Application →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                This is an automated message from the CuriousBees platform. Do not reply.<br/>
                SRMIST • Institutional Research Portal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [this.adminEmail],
          subject: `[CuriousBees] New Supervisor Request — ${supervisor.name}`,
          html,
        }),
      });

      if (res.ok) {
        this.logger.log(
          `[MailService] Admin notification sent to ${this.adminEmail} for supervisor ${supervisor.email}`,
        );
      } else {
        const body = await res.text();
        this.logger.warn(
          `[MailService] Resend API returned ${res.status}: ${body}`,
        );
      }
    } catch (err: any) {
      this.logger.warn(
        `[MailService] Failed to send admin notification: ${err.message}`,
      );
    }
  }
}
