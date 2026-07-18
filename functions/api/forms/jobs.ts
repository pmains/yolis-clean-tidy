/**
 * Jobs application form handler (Cloudflare Pages Function)
 * POST /api/forms/jobs
 *
 * Receives job application form submissions and sends them via email.
 */

interface JobApplication {
  name: string;
  phone: string;
  email: string;
  transportation: string;
  can_commute: string;
  cross_streets: string;
  availability: string;
  about: string;
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: JobApplication = await request.json();

    // Validate required fields
    const required: (keyof JobApplication)[] = ['name', 'phone', 'email', 'transportation', 'can_commute', 'cross_streets', 'availability', 'about'];
    for (const field of required) {
      if (!body[field] || body[field].trim() === '') {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Build email content
    const subject = `New Job Application: ${body.name}`;
    const text = `
Job Application — Yoli's Clean and Tidy

Name: ${body.name}
Phone: ${body.phone}
Email: ${body.email}
Transportation: ${body.transportation}
Can Commute: ${body.can_commute}
Cross Streets: ${body.cross_streets}
Availability: ${body.availability}
About: ${body.about}
    `.trim();

    // Try to send via Resend if API key is configured
    const resendApiKey = context.env.RESEND_API_KEY;
    const notifyEmail = context.env.NOTIFY_EMAIL || 'peter.mains@gmail.com';

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
        // Fall through to return success anyway — the form was received
      }
    } else {
      console.log('No RESEND_API_KEY configured. Form data logged:', JSON.stringify(body));
      console.log('Would send email to:', notifyEmail);
    }

    return new Response(JSON.stringify({ success: true, message: 'Application submitted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Form handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
