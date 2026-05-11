const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalize(value) {
  return String(value || '').trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { message: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    return sendJson(res, 500, {
      message: 'Missing email service configuration',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return sendJson(res, 400, {
      message: 'Invalid request body',
    });
  }

  const recipients = to
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!recipients.length) {
    return sendJson(res, 500, {
      message: 'Missing recipient email configuration',
    });
  }

  const name = normalize(body.name);
  const phone = normalize(body.phone);
  const email = normalize(body.email);
  const message = normalize(body.message);
  const website = normalize(body.website); // Honeypot field

  // Honeypot check: real users never fill this hidden field
  if (website) {
    return sendJson(res, 200, { message: 'Submitted' });
  }

  if (!name || !phone) {
    return sendJson(res, 400, {
      message: 'Vui lòng nhập họ tên và số điện thoại.',
    });
  }

  const submittedAt = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email || 'Không cung cấp');
  const safeMessage = escapeHtml(message || 'Không có lời nhắn');
  const safeSubmittedAt = escapeHtml(submittedAt);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 16px;color:#CDA26E">Lead mới từ Monrei Saigon</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px">
        <tr><td style="font-weight:bold;border:1px solid #eee;background:#f9f9f9;width:30%">Họ tên</td><td style="border:1px solid #eee">${safeName}</td></tr>
        <tr><td style="font-weight:bold;border:1px solid #eee;background:#f9f9f9">Số điện thoại</td><td style="border:1px solid #eee"><a href="tel:${safePhone}">${safePhone}</a></td></tr>
        <tr><td style="font-weight:bold;border:1px solid #eee;background:#f9f9f9">Email</td><td style="border:1px solid #eee">${safeEmail}</td></tr>
        <tr><td style="font-weight:bold;border:1px solid #eee;background:#f9f9f9">Nội dung</td><td style="border:1px solid #eee">${safeMessage}</td></tr>
        <tr><td style="font-weight:bold;border:1px solid #eee;background:#f9f9f9">Thời gian</td><td style="border:1px solid #eee">${safeSubmittedAt}</td></tr>
      </table>
      <p style="font-size:12px;color:#888;margin-top:20px">Hệ thống ghi nhận Lead tự động từ monrei-sai-gon.vn</p>
    </div>
  `;

  const text = [
    'Lead mới từ Monrei Saigon',
    `Họ tên: ${name}`,
    `Số điện thoại: ${phone}`,
    `Email: ${email || 'Không cung cấp'}`,
    `Nội dung: ${message || 'Không có lời nhắn'}`,
    `Thời gian: ${submittedAt}`,
  ].join('\n');

  const resendResponse = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `Lead mới: ${name} - ${phone}`,
      html,
      text,
      reply_to: email || undefined,
      tags: [
        { name: 'source', value: 'landing-page' },
        { name: 'project', value: 'monrei-saigon' },
      ],
    }),
  });

  const data = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    return sendJson(res, resendResponse.status, {
      message: data.message || 'Không gửi được email. Vui lòng thử lại.',
    });
  }

  return sendJson(res, 200, {
    message: 'Thông tin đã được gửi.',
    id: data.id,
  });
};
