import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { candidato_nome, candidato_email, vaga_titulo, vaga_setor, codigo } = await req.json();

    const data_geracao = new Date().toLocaleDateString("pt-BR");

    const { error } = await resend.emails.send({
      from: "SPA Talentos <onboarding@resend.dev>",
      to: candidato_email,
      subject: `✅ Você foi aprovado! Carta de Encaminhamento — ${vaga_titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          
          <div style="background: #08213E; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; font-size: 20px; margin: 0;">SPA Talentos</h1>
            <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 8px 0 0;">Secretaria de Desenvolvimento Econômico · São Pedro da Aldeia</p>
          </div>

          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb;">
            <h2 style="color: #08213E; font-size: 22px;">Parabéns, ${candidato_nome}! 🎉</h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
              Você foi <strong>aprovado(a)</strong> pela Secretaria de Desenvolvimento Econômico de São Pedro da Aldeia para a vaga de:
            </p>

            <div style="background: #EFF6FF; border-left: 4px solid #08213E; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #08213E; font-size: 18px; font-weight: bold; margin: 0;">${vaga_titulo}</p>
              ${vaga_setor ? `<p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">${vaga_setor}</p>` : ""}
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Sua carta de encaminhamento está disponível no sistema. Acesse sua conta no SPA Talentos, vá em <strong>"Minhas candidaturas"</strong> e clique em <strong>"Baixar carta de encaminhamento"</strong>.
            </p>

            <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Código de autenticação: <strong>${codigo}</strong><br/>
                Gerado em: ${data_geracao}
              </p>
            </div>

            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
              Este encaminhamento não garante a contratação. A decisão final é de exclusiva responsabilidade da empresa contratante.
            </p>
          </div>

          <div style="background: #F3F4F6; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Secretaria de Desenvolvimento Econômico · Prefeitura de São Pedro da Aldeia · RJ<br/>
              Sistema SPA Talentos — gratuito para todos os moradores
            </p>
          </div>

        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ sucesso: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 });
  }
}