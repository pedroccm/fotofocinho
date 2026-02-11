import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM || "Fable <onboarding@resend.dev>";

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:700;color:#ffffff;margin:0;letter-spacing:-0.02em;">
        Fable
      </h1>
      <p style="font-size:10px;letter-spacing:0.3em;color:rgba(255,255,255,0.3);margin:4px 0 0;">
        PET PORTRAITS
      </p>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px;margin-bottom:24px;">
      ${content}
    </div>
    <div style="text-align:center;">
      <p style="font-size:12px;color:rgba(255,255,255,0.2);margin:0;">
        © 2025 Fable. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendDigitalDownloadEmail(
  to: string,
  customerName: string,
  downloadUrl: string
): Promise<void> {
  const firstName = customerName.split(" ")[0];

  const html = baseTemplate(`
    <h2 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;font-style:italic;">
      Sua Obra-Prima está Pronta! ✨
    </h2>
    <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0 0 24px;line-height:1.6;">
      Olá ${firstName}, seu retrato real ficou incrível! Clique no botão abaixo para baixar em alta resolução, sem marca d'água.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${downloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a96e,#dfc08a);color:#0a0a0a;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">
        📥 Baixar Retrato HD
      </a>
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:24px 0 0;text-align:center;">
      Este link é válido por 7 dias. Salve a imagem assim que possível.
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${firstName}, seu retrato real está pronto! 🎨`,
    html,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  customerName: string,
  productName: string,
  price: string,
  orderId: string
): Promise<void> {
  const firstName = customerName.split(" ")[0];

  const html = baseTemplate(`
    <h2 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;font-style:italic;">
      Pedido Confirmado! 🎉
    </h2>
    <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0 0 24px;line-height:1.6;">
      Olá ${firstName}, recebemos seu pedido e já estamos preparando tudo com carinho.
    </p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:rgba(255,255,255,0.3);padding:4px 0;">Pedido</td>
          <td style="font-size:14px;color:#fff;text-align:right;padding:4px 0;">#${orderId.slice(0, 8)}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:rgba(255,255,255,0.3);padding:4px 0;">Produto</td>
          <td style="font-size:14px;color:#fff;text-align:right;padding:4px 0;">${productName}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:rgba(255,255,255,0.3);padding:4px 0;">Valor</td>
          <td style="font-size:14px;color:#c9a96e;font-weight:700;text-align:right;padding:4px 0;">${price}</td>
        </tr>
      </table>
    </div>
    <div style="margin-bottom:16px;">
      <h3 style="font-size:14px;color:#c9a96e;margin:0 0 12px;">Próximos passos</h3>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 8px;line-height:1.5;">
        ✅ Pagamento confirmado<br>
        ⏳ Impressão em andamento (1-2 dias úteis)<br>
        📦 Envio pelos Correios com código de rastreio<br>
        🏠 Entrega estimada: 5-10 dias úteis
      </p>
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0;line-height:1.5;">
      Você receberá outro e-mail com o código de rastreio assim que enviarmos seu pedido.
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Pedido confirmado! Seu ${productName} está a caminho 🎨`,
    html,
  });
}

export async function sendShippingEmail(
  to: string,
  customerName: string,
  trackingCode: string,
  productName: string
): Promise<void> {
  const firstName = customerName.split(" ")[0];

  const html = baseTemplate(`
    <h2 style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 8px;font-style:italic;">
      Seu Pedido foi Enviado! 📦
    </h2>
    <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0 0 24px;line-height:1.6;">
      Olá ${firstName}, seu ${productName} acabou de ser despachado!
    </p>
    <div style="background:rgba(201,169,110,0.05);border:1px solid rgba(201,169,110,0.2);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 8px;">Código de Rastreio</p>
      <p style="font-size:20px;font-weight:700;color:#c9a96e;margin:0;letter-spacing:0.05em;">
        ${trackingCode}
      </p>
    </div>
    <div style="text-align:center;">
      <a href="https://www.linkcorreios.com.br/?id=${trackingCode}" style="display:inline-block;background:linear-gradient(135deg,#c9a96e,#dfc08a);color:#0a0a0a;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
        Rastrear Pedido
      </a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Seu ${productName} foi enviado! 📦 Rastreio: ${trackingCode}`,
    html,
  });
}
