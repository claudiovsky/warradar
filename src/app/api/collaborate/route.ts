import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Rate limit: max 3 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, why, how } = body;

    // Validation
    if (!name || !email || !why || !how) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.length > 100) {
      return NextResponse.json({ error: "Invalid name." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 200) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    if (typeof why !== "string" || why.length > 2000) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    if (typeof how !== "string" || how.length > 2000) {
      return NextResponse.json({ error: "Message too long." }, { status: 400 });
    }

    // Configure SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"WAR-RADAR Collaborate" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || process.env.SMTP_USER || "",
      replyTo: email,
      subject: `[WAR-RADAR] New Collaboration Request from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e4e4e7; padding: 32px; border-radius: 16px;">
          <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 24px;">
            🔴 New Collaboration Request
          </h1>
          
          <div style="background: rgba(39,39,42,0.3); padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <p style="color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px;">Name</p>
            <p style="color: #fff; font-size: 16px; margin: 0;">${name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>

          <div style="background: rgba(39,39,42,0.3); padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <p style="color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px;">Email</p>
            <p style="color: #fff; font-size: 16px; margin: 0;">
              <a href="mailto:${email}" style="color: #ef4444;">${email.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</a>
            </p>
          </div>

          <div style="background: rgba(39,39,42,0.3); padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <p style="color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px;">Why do they want to collaborate?</p>
            <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${why.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>

          <div style="background: rgba(39,39,42,0.3); padding: 20px; border-radius: 12px; margin-bottom: 16px;">
            <p style="color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px;">How can they contribute?</p>
            <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${how.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
          <p style="color: #52525b; font-size: 11px; text-align: center; margin: 0;">
            Sent via WAR-RADAR Collaboration Form • ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collaborate API error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
