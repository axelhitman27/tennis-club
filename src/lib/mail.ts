import nodemailer from "nodemailer";

// Works with any SMTP server, including the mailbox that comes with Hostinger hosting.
// Without SMTP_HOST (local dev) the message is printed to the console instead.
export async function sendMail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[mail to ${to}] ${subject}\n${text}`);
    return;
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject, text });
}
