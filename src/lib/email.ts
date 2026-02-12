import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM || "Fotofocinho <onboarding@resend.dev>";

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;font-weight:600;color:#5C4B3A;margin:0;letter-spacing:-0.02em;">
        fotofocinho
      </h1>
      <p style="font-size:10px;letter-spacing:0.3em;color:#8B7E72;margin:4px 0 0;">
        PET PORTRAITS
      </p>
    </div>
    <div style="background:#FFFDF9;border:1px solid rgba(197,212,184,0.3);border-radius:16px;padding:32px;margin-bottom:24px;">
      ${content}
    </div>
    <div style="text-align:center;">
      <p style="font-size:12px;color:#8B7E72;margin:0;">
        &copy; 2025 Fotofocinho. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(
  to: string,
  customerName: string,
  loginUrl: string
): Promise<void> {
  const firstName = customerName.split(" ")[0];

  const html = baseTemplate(`
    <h2 style="font-size:22px;font-weight:700;color:#5C4B3A;margin:0 0 8px;">
      Bem-vindo ao Fotofocinho!
    </h2>
    <p style="font-size:14px;color:#8B7E72;margin:0 0 24px;line-height:1.6;">
      Ola ${firstName}, sua conta foi criada com sucesso! Use o e-mail e a senha que voce escolheu na compra para acessar.
    </p>
    <div style="background:#F5F0E8;border:1px solid rgba(197,212,184,0.4);border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:#8B7E72;padding:6px 0;">Email</td>
          <td style="font-size:14px;color:#5C4B3A;font-weight:600;text-align:right;padding:6px 0;">${to}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#8B7E72;padding:6px 0;">Senha</td>
          <td style="font-size:14px;color:#C17F59;font-weight:700;text-align:right;padding:6px 0;">a que voce escolheu no checkout</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${loginUrl}" style="display:inline-block;background:#C17F59;color:#ffffff;padding:14px 32px;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none;">
        Acessar Minha Conta
      </a>
    </div>
    <p style="font-size:12px;color:#8B7E72;margin:24px 0 0;text-align:center;">
      Acompanhe seus pedidos e baixe seus retratos na sua conta.
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${firstName}, sua conta Fotofocinho foi criada!`,
    html,
  });
}

export async function sendDigitalDownloadEmail(
  to: string,
  customerName: string,
  downloadUrl: string
): Promise<void> {
  const firstName = customerName.split(" ")[0];

  const html = baseTemplate(`
    <h2 style="font-size:22px;font-weight:700;color:#5C4B3A;margin:0 0 8px;">
      Sua Obra-Prima esta Pronta!
    </h2>
    <p style="font-size:14px;color:#8B7E72;margin:0 0 24px;line-height:1.6;">
      Ola ${firstName}, seu retrato ficou incrivel! Clique no botao abaixo para baixar em alta resolucao, sem marca d'agua.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${downloadUrl}" style="display:inline-block;background:#C17F59;color:#ffffff;padding:14px 32px;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none;">
        Baixar Retrato HD
      </a>
    </div>
    <p style="font-size:12px;color:#8B7E72;margin:24px 0 0;text-align:center;">
      Este link e valido por 7 dias. Salve a imagem assim que possivel.
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${firstName}, seu retrato esta pronto!`,
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
    <h2 style="font-size:22px;font-weight:700;color:#5C4B3A;margin:0 0 8px;">
      Pedido Confirmado!
    </h2>
    <p style="font-size:14px;color:#8B7E72;margin:0 0 24px;line-height:1.6;">
      Ola ${firstName}, recebemos seu pedido e ja estamos preparando tudo com carinho.
    </p>
    <div style="background:#F5F0E8;border:1px solid rgba(197,212,184,0.4);border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:#8B7E72;padding:4px 0;">Pedido</td>
          <td style="font-size:14px;color:#5C4B3A;text-align:right;padding:4px 0;">#${orderId.slice(0, 8)}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#8B7E72;padding:4px 0;">Produto</td>
          <td style="font-size:14px;color:#5C4B3A;text-align:right;padding:4px 0;">${productName}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#8B7E72;padding:4px 0;">Valor</td>
          <td style="font-size:14px;color:#C17F59;font-weight:700;text-align:right;padding:4px 0;">${price}</td>
        </tr>
      </table>
    </div>
    <div style="margin-bottom:16px;">
      <h3 style="font-size:14px;color:#C17F59;margin:0 0 12px;">Proximos passos</h3>
      <p style="font-size:13px;color:#8B7E72;margin:0 0 8px;line-height:1.5;">
        Pagamento confirmado<br>
        Impressao em andamento (1-2 dias uteis)<br>
        Envio pelos Correios com codigo de rastreio<br>
        Entrega estimada: 5-10 dias uteis
      </p>
    </div>
    <p style="font-size:12px;color:#8B7E72;margin:0;line-height:1.5;">
      Voce recebera outro e-mail com o codigo de rastreio assim que enviarmos seu pedido.
    </p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Pedido confirmado! Seu ${productName} esta a caminho`,
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
    <h2 style="font-size:22px;font-weight:700;color:#5C4B3A;margin:0 0 8px;">
      Seu Pedido foi Enviado!
    </h2>
    <p style="font-size:14px;color:#8B7E72;margin:0 0 24px;line-height:1.6;">
      Ola ${firstName}, seu ${productName} acabou de ser despachado!
    </p>
    <div style="background:#F5F0E8;border:1px solid rgba(193,127,89,0.2);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
      <p style="font-size:12px;color:#8B7E72;margin:0 0 8px;">Codigo de Rastreio</p>
      <p style="font-size:20px;font-weight:700;color:#C17F59;margin:0;letter-spacing:0.05em;">
        ${trackingCode}
      </p>
    </div>
    <div style="text-align:center;">
      <a href="https://www.linkcorreios.com.br/?id=${trackingCode}" style="display:inline-block;background:#C17F59;color:#ffffff;padding:12px 28px;border-radius:50px;font-size:14px;font-weight:700;text-decoration:none;">
        Rastrear Pedido
      </a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Seu ${productName} foi enviado! Rastreio: ${trackingCode}`,
    html,
  });
}
