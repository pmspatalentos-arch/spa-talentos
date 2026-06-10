"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import { Suspense } from "react";

type Carta = {
  candidato_nome: string;
  candidato_email: string;
  vaga_titulo: string;
  vaga_setor: string;
  data_geracao: string;
  codigo: string;
};

function CartaContent() {
  const [carta, setCarta] = useState<Carta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const params = useSearchParams();
  const candidaturaId = params.get("id");

  useEffect(() => {
    const carregar = async () => {
      if (!candidaturaId) return;

      const { data } = await supabase
        .from("candidaturas")
        .select("*, vagas_spa(titulo, setor)")
        .eq("id", candidaturaId)
        .single();

      if (data) {
        setCarta({
          candidato_nome: data.candidato_nome,
          candidato_email: data.candidato_email,
          vaga_titulo: data.vagas_spa?.titulo || "Vaga",
          vaga_setor: data.vagas_spa?.setor || "",
          data_geracao: new Date().toLocaleDateString("pt-BR"),
          codigo: candidaturaId.substring(0, 8).toUpperCase(),
        });
      }
      setCarregando(false);
    };
    carregar();
  }, [candidaturaId]);

  const gerarPDF = async () => {
    if (!carta) return;
    setGerando(true);

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFillColor(8, 33, 62);
    doc.rect(0, 0, pageW, 50, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("CARTA DE ENCAMINHAMENTO", pageW / 2, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 200, 230);
    doc.text("Secretaria de Desenvolvimento Econômico", pageW / 2, 30, { align: "center" });
    doc.text("Prefeitura Municipal de São Pedro da Aldeia — RJ", pageW / 2, 38, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(233, 162, 59);
    doc.text(`Código de autenticação: ${carta.codigo}`, pageW / 2, 46, { align: "center" });

    // Corpo
    let y = 70;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`São Pedro da Aldeia, ${carta.data_geracao}`, 14, y);
    y += 16;

    doc.setFontSize(11);
    doc.text("À empresa parceira,", 14, y);
    y += 16;

    const texto1 = `A Secretaria de Desenvolvimento Econômico do Município de São Pedro da Aldeia, por meio do sistema SPA Talentos, encaminha o(a) candidato(a):`;
    const lines1 = doc.splitTextToSize(texto1, pageW - 28);
    doc.text(lines1, 14, y);
    y += lines1.length * 7 + 8;

    // Box candidato
    doc.setFillColor(240, 246, 255);
    doc.rect(14, y, pageW - 28, 30, "F");
    doc.setFillColor(8, 33, 62);
    doc.rect(14, y, 3, 30, "F");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(8, 33, 62);
    doc.text(carta.candidato_nome, 22, y + 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(carta.candidato_email, 22, y + 22);
    y += 42;

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const texto2 = `Para a vaga de ${carta.vaga_titulo}${carta.vaga_setor ? ` (${carta.vaga_setor})` : ""}, em conformidade com as necessidades informadas pela empresa ao município.`;
    const lines2 = doc.splitTextToSize(texto2, pageW - 28);
    doc.text(lines2, 14, y);
    y += lines2.length * 7 + 12;

    const texto3 = `Solicitamos que o(a) candidato(a) seja recebido(a) para avaliação, ressaltando que este encaminhamento não garante a contratação, sendo a decisão final de exclusiva responsabilidade da empresa contratante.`;
    const lines3 = doc.splitTextToSize(texto3, pageW - 28);
    doc.text(lines3, 14, y);
    y += lines3.length * 7 + 16;

    doc.text("Atenciosamente,", 14, y);
    y += 16;

    doc.setFont("helvetica", "bold");
    doc.text("Secretaria de Desenvolvimento Econômico", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("Prefeitura Municipal de São Pedro da Aldeia — RJ", 14, y);
    y += 8;
    doc.text("Sistema SPA Talentos", 14, y);
    y += 24;

    // Linha de assinatura
    doc.setDrawColor(150, 150, 150);
    doc.line(14, y, 100, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Assinatura e carimbo da Secretaria", 14, y);

    // Rodapé
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 275, pageW, 22, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Documento gerado em ${carta.data_geracao} · Código: ${carta.codigo} · SPA Talentos · São Pedro da Aldeia`, pageW / 2, 284, { align: "center" });
    doc.text("Este documento pode ser verificado na Secretaria de Desenvolvimento Econômico.", pageW / 2, 291, { align: "center" });

    doc.save(`carta_encaminhamento_${carta.candidato_nome.replace(/\s+/g, "_").toLowerCase()}.pdf`);
    setGerando(false);
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#08213E] flex items-center justify-center">
        <div className="text-white/50 text-sm">Carregando...</div>
      </main>
    );
  }

  if (!carta) {
    return (
      <main className="min-h-screen bg-[#08213E] flex items-center justify-center">
        <div className="text-white/50 text-sm">Carta não encontrada.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Cabeçalho */}
        <div className="bg-[#08213E] px-8 py-8 text-center">
          <h1 className="text-xl font-bold text-white mb-1">Carta de Encaminhamento</h1>
          <p className="text-white/50 text-sm">Secretaria de Desenvolvimento Econômico</p>
          <p className="text-white/40 text-xs mt-1">Prefeitura Municipal de São Pedro da Aldeia — RJ</p>
          <div className="mt-4 inline-block px-4 py-1.5 bg-yellow-400/20 rounded-full">
            <span className="text-yellow-400 text-xs font-bold">Código: {carta.codigo}</span>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-8 py-8">
          <p className="text-gray-500 text-sm mb-6">São Pedro da Aldeia, {carta.data_geracao}</p>

          <p className="text-gray-700 text-sm leading-relaxed mb-6">
            A Secretaria de Desenvolvimento Econômico encaminha o(a) candidato(a) abaixo para avaliação:
          </p>

          {/* Box candidato */}
          <div className="bg-blue-50 border-l-4 border-[#08213E] rounded-xl p-5 mb-6">
            <p className="text-xl font-bold text-[#08213E]">{carta.candidato_nome}</p>
            <p className="text-gray-500 text-sm mt-1">{carta.candidato_email}</p>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed mb-6">
            Para a vaga de <strong>{carta.vaga_titulo}</strong>{carta.vaga_setor && ` (${carta.vaga_setor})`}, conforme necessidades informadas ao município.
          </p>

          <p className="text-gray-500 text-xs leading-relaxed mb-8 p-4 bg-gray-50 rounded-xl">
            Este encaminhamento não garante a contratação. A decisão final é de exclusiva responsabilidade da empresa contratante.
          </p>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-700 font-semibold">Secretaria de Desenvolvimento Econômico</p>
            <p className="text-xs text-gray-400 mt-1">Prefeitura Municipal de São Pedro da Aldeia — RJ</p>
            <p className="text-xs text-gray-400">Sistema SPA Talentos</p>
          </div>
        </div>

        {/* Botão */}
        <div className="px-8 pb-8">
          <button
            onClick={gerarPDF}
            disabled={gerando}
            className="w-full py-4 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 transition-all disabled:opacity-40"
          >
            {gerando ? "Gerando PDF..." : "⬇️ Baixar carta em PDF"}
          </button>
        </div>

      </div>
    </main>
  );
}

export default function Carta() {
  return (
    <Suspense>
      <CartaContent />
    </Suspense>
  );
}