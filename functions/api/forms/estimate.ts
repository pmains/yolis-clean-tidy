/**
 * Estimate form handler (Cloudflare Pages Function)
 * POST /api/forms/estimate
 *
 * Receives estimate requests, stores them in Airtable,
 * and sends a notification email.
 */

interface EstimateRequest {
  name: string;
  phone: string;
  email: string;
  property_type: string;
  service_needed: string;
  size: string;
  frequency: string;
  preferred_days: string;
  message: string;
}

const AIRTABLE_API = 'https://api.airtable.com/v0';

async function submitToAirtable(body: EstimateRequest, env: Record<string, string | undefined>): Promise<void> {
  const apiKey = env.YOLIS_AIRTABLE_API_KEY;
  const baseId = env.YOLIS_AIRTABLE_BASE_ID;
  const tableName = env.YOLIS_AIRTABLE_ESTIMATES_TABLE || 'Estimates';

  if (!apiKey || !baseId) {
    console.log('Airtable not configured — skipping Airtable submission');
    return;
  }

  const payload = {
    records: [
      {
        fields: {
          Name: body.name,
          Phone: body.phone,
          Email: body.email,
          'Property Type': body.property_type,
          'Service Needed': body.service_needed,
          Size: body.size || '',
          Frequency: body.frequency || '',
          'Preferred Days': body.preferred_days || '',
          Message: body.message,
        },
      },
    ],
  };

  const res = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableName)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Airtable API error:', res.status, errBody);
  }
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: EstimateRequest = await request.json();

    // Validate required fields
    const required: (keyof EstimateRequest)[] = ['name', 'phone', 'email', 'property_type', 'service_needed', 'message'];
    for (const field of required) {
      if (!body[field] || body[field].trim() === '') {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Submit to Airtable (non-blocking — don't fail the request if it errors)
    try {
      await submitToAirtable(body, context.env);
    } catch (airtableErr) {
      console.error('Airtable submission failed:', airtableErr);
    }

    // Send notification email via Resend
    const subject = `New Estimate Request from ${body.name}`;
    const text = `
Estimate Request — Yoli's Clean and Tidy

Name: ${body.name}
Phone: ${body.phone}
Email: ${body.email}
Property Type: ${body.property_type}
Service Needed: ${body.service_needed}
Size / Sq Ft: ${body.size || 'Not specified'}
Frequency: ${body.frequency || 'Not specified'}
Preferred Days: ${body.preferred_days || 'Not specified'}
Details: ${body.message}
    `.trim();

    const resendApiKey = context.env.YOLIS_RESEND_API_KEY;
    const notifyEmail = context.env.YOLIS_NOTIFY_EMAIL || 'peter.mains@gmail.com';

    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yolis Clean & Tidy <forms@yoliscleanandtidy.com>',
          to: [notifyEmail],
          subject,
          text,
        }),
      });

      if (!resendRes.ok) {
        console.error('Resend API error:', await resendRes.text());
      }
    } else {
      console.log('No RESEND_API_KEY configured. Estimate data:', JSON.stringify(body));
    }

    return new Response(JSON.stringify({ success: true, message: 'Estimate request submitted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Estimate form handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
