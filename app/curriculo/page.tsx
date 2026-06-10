"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

const Dica = ({ texto }: { texto: string }) => {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="relative inline-block ml-2">
      <button onClick={() => setAberta(!aberta)} className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold hover:bg-blue-200 transition-all flex items-center justify-center" type="button">?</button>
      {aberta && (
        <div className="absolute z-50 left-0 top-7 w-64 bg-[#08213E] text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
          {texto}
          <button onClick={() => setAberta(false)} className="block mt-2 text-yellow-400 font-semibold">Fechar</button>
        </div>
      )}
    </div>
  );
};

export default function Curriculo() {
  const [etapa, setEtapa] = useState(1);
  const [gerando, setGerando] = useState(false);
  const [nuncaTrabalhou, setNuncaTrabalhou] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", bairro: "",
    cidade: "São Pedro da Aldeia", estado: "RJ",
    objetivo: "", escolaridade: "", instituicao: "",
    anoConclusao: "", empresa1: "", cargo1: "", periodo1: "",
    empresa2: "", cargo2: "", periodo2: "",
    habilidades: "", cursos: "",
  });

  const router = useRouter();
  const atualizar = (campo: string, valor: string) => setForm(prev => ({ ...prev, [campo]: valor }));
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400";

  const gerarPDF = async () => {
    setGerando(true);
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 0;

      doc.setFillColor(8, 33, 62);
      doc.rect(0, 0, pageW, 45, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(form.nome.toUpperCase(), 14, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 200, 230);
      doc.text(`${form.email}  ·  ${form.telefone}  ·  ${form.bairro}, ${form.cidade} - ${form.estado}`, 14, 28);
      doc.setFontSize(8);
      doc.setTextColor(233, 162, 59);
      doc.text("Emitido pelo Sistema SPA Talentos · Secretaria de Desenvolvimento Econômico · São Pedro da Aldeia", 14, 38);

      y = 55;

      const secao = (titulo: string) => {
        doc.setFillColor(8, 33, 62);
        doc.rect(14, y, pageW - 28, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(titulo.toUpperCase(), 17, y + 5);
        y += 12;
      };

      const linha = (texto: string, negrito = false) => {
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10);
        doc.setFont("helvetica", negrito ? "bold" : "normal");
        const lines = doc.splitTextToSize(texto, pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 6 + 2;
      };

      if (form.objetivo) { secao("Objetivo Profissional"); linha(form.objetivo); y += 4; }

      if (!nuncaTrabalhou && form.empresa1) {
        secao("Experiência Profissional");
        linha(`${form.cargo1} — ${form.empresa1}`, true);
        if (form.periodo1) linha(form.periodo1);
        y += 4;
        if (form.empresa2) {
          linha(`${form.cargo2} — ${form.empresa2}`, true);
          if (form.periodo2) linha(form.periodo2);
          y += 4;
        }
      } else if (nuncaTrabalhou) {
        secao("Experiência Profissional");
        linha("Primeiro emprego — sem experiência anterior registrada.");
        y += 4;
      }

      if (form.escolaridade) {
        secao("Formação Acadêmica");
        linha(form.escolaridade, true);
        if (form.instituicao) linha(form.instituicao);
        if (form.anoConclusao) linha(`Conclusão: ${form.anoConclusao}`);
        y += 4;
      }

      if (form.habilidades) { secao("Habilidades"); linha(form.habilidades); y += 4; }
      if (form.cursos) { secao("Cursos e Certificações"); linha(form.cursos); y += 4; }

      doc.setFillColor(240, 240, 240);
      doc.rect(0, 282, pageW, 15, "F");
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(7);
      doc.text(`Currículo gerado em ${new Date().toLocaleDateString("pt-BR")} · SPA Talentos · spatalentos.gov.br`, pageW / 2, 290, { align: "center" });

      const pdfBlob = doc.output("blob");
      const nomeArquivo = `curriculo_${form.nome.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.pdf`;
      doc.save(nomeArquivo);

      // Salva no perfil pelo user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: upload } = await supabase.storage
          .from("curriculos")
          .upload(nomeArquivo, pdfBlob, { contentType: "application/pdf" });

        if (upload) {
          // Tenta pelo user_id primeiro
          const { data: porId } = await supabase
            .from("candidatos_temp")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (porId) {
            await supabase.from("candidatos_temp").update({
              curriculo_gerado: true,
              curriculo_url: nomeArquivo,
              tem_curriculo: true,
              objetivo_profissional: form.objetivo,
              habilidades: form.habilidades,
            }).eq("id", porId.id);
          } else {
            // Fallback pelo email
            const { data: porEmail } = await supabase
              .from("candidatos_temp")
              .select("id")
              .eq("email", user.email!)
              .single();

            if (porEmail) {
              await supabase.from("candidatos_temp").update({
                curriculo_gerado: true,
                curriculo_url: nomeArquivo,
                tem_curriculo: true,
                objetivo_profissional: form.objetivo,
                habilidades: form.habilidades,
                user_id: user.id,
              }).eq("id", porEmail.id);
            }
          }
        }
      }

      router.push("/painel");
    } catch (e) {
      console.error(e);
    } finally {
      setGerando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08213E] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg mb-8">
        <button onClick={() => router.back()} className="text-white/40 text-sm hover:text-white/70 transition-colors">← Voltar</button>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= etapa ? "bg-yellow-400" : "bg-gray-200"}`} />
          ))}
        </div>

        {etapa === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-[#08213E] mb-1">Seus dados</h2>
            <p className="text-gray-500 text-sm mb-6">Informações básicas para o currículo.</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Nome completo<Dica texto="Escreva seu nome completo como está no documento de identidade. Ex: Maria da Silva Santos." /></label>
                <input type="text" value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} placeholder="Seu nome completo" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">E-mail<Dica texto="Use um e-mail que você acessa com frequência. É por ele que as empresas vão entrar em contato." /></label>
                <input type="email" value={form.email} onChange={(e) => atualizar("email", e.target.value)} placeholder="seu@email.com" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Telefone<Dica texto="Coloque seu WhatsApp se tiver. Facilita o contato rápido das empresas." /></label>
                <input type="tel" value={form.telefone} onChange={(e) => atualizar("telefone", e.target.value)} placeholder="(22) 99999-9999" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Bairro<Dica texto="Coloque o bairro onde você mora em São Pedro da Aldeia. Isso ajuda as empresas a entender sua localização." /></label>
                <input type="text" value={form.bairro} onChange={(e) => atualizar("bairro", e.target.value)} placeholder="Ex: Centro, Balneário, Boqueirão..." className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Objetivo profissional<Dica texto="Escreva em uma ou duas frases o tipo de trabalho que você busca. Ex: Busco oportunidade na área de comércio ou atendimento ao público. Não precisa ser perfeito, seja honesto." /></label>
                <textarea value={form.objetivo} onChange={(e) => atualizar("objetivo", e.target.value)} placeholder="Ex: Busco uma oportunidade na área de vendas ou atendimento ao cliente..." rows={3} className={`${inputClass} resize-none`} />
              </div>
            </div>
            <button onClick={() => setEtapa(2)} disabled={!form.nome || !form.email} className="mt-6 w-full py-4 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 disabled:opacity-40 transition-all">Continuar →</button>
          </div>
        )}

        {etapa === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-[#08213E] mb-1">Experiência</h2>
            <p className="text-gray-500 text-sm mb-4">Onde você já trabalhou?</p>
            <button onClick={() => setNuncaTrabalhou(!nuncaTrabalhou)} className={`w-full p-4 rounded-xl border-2 text-left transition-all mb-4 ${nuncaTrabalhou ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}`} type="button">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${nuncaTrabalhou ? "border-yellow-400 bg-yellow-400" : "border-gray-300"}`}>
                  {nuncaTrabalhou && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="font-semibold text-[#08213E] text-sm">Este é meu primeiro emprego</div>
                  <div className="text-gray-500 text-xs mt-0.5">Nunca trabalhei formalmente antes</div>
                </div>
              </div>
            </button>
            {!nuncaTrabalhou && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center">Emprego mais recente<Dica texto="Coloque o trabalho mais recente que você teve. Pode ser emprego formal, bico, trabalho autônomo ou serviço doméstico — tudo conta." /></p>
                  <div className="flex flex-col gap-3">
                    <input type="text" value={form.empresa1} onChange={(e) => atualizar("empresa1", e.target.value)} placeholder="Nome da empresa ou empregador" className={inputClass} />
                    <input type="text" value={form.cargo1} onChange={(e) => atualizar("cargo1", e.target.value)} placeholder="Cargo ou função. Ex: Vendedor, Cozinheiro, Faxineira" className={inputClass} />
                    <input type="text" value={form.periodo1} onChange={(e) => atualizar("periodo1", e.target.value)} placeholder="Ex: Jan/2022 – Dez/2023 ou 2022 até hoje" className={inputClass} />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Emprego anterior (opcional)</p>
                  <div className="flex flex-col gap-3">
                    <input type="text" value={form.empresa2} onChange={(e) => atualizar("empresa2", e.target.value)} placeholder="Nome da empresa ou empregador" className={inputClass} />
                    <input type="text" value={form.cargo2} onChange={(e) => atualizar("cargo2", e.target.value)} placeholder="Cargo ou função" className={inputClass} />
                    <input type="text" value={form.periodo2} onChange={(e) => atualizar("periodo2", e.target.value)} placeholder="Ex: Mar/2020 – Dez/2021" className={inputClass} />
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEtapa(1)} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">← Voltar</button>
              <button onClick={() => setEtapa(3)} className="flex-[2] py-4 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 transition-all">Continuar →</button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-[#08213E] mb-1">Formação</h2>
            <p className="text-gray-500 text-sm mb-6">Seus estudos e cursos realizados.</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Escolaridade<Dica texto="Selecione o nível de estudo mais alto que você concluiu ou está cursando atualmente." /></label>
                <select value={form.escolaridade} onChange={(e) => atualizar("escolaridade", e.target.value)} className={inputClass}>
                  <option value="">Selecione...</option>
                  <option value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</option>
                  <option value="Ensino Fundamental Completo">Ensino Fundamental Completo</option>
                  <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                  <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                  <option value="Ensino Técnico">Ensino Técnico</option>
                  <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
                  <option value="Ensino Superior Completo">Ensino Superior Completo</option>
                  <option value="Pós-graduação">Pós-graduação</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Instituição de ensino<Dica texto="Nome da escola, colégio ou faculdade onde você estudou. Ex: Escola Estadual Fulano de Tal, FAETEC São Pedro da Aldeia." /></label>
                <input type="text" value={form.instituicao} onChange={(e) => atualizar("instituicao", e.target.value)} placeholder="Ex: FAETEC São Pedro da Aldeia" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Ano de conclusão<Dica texto="Ano em que você terminou ou vai terminar. Se ainda está estudando, escreva Em andamento." /></label>
                <input type="text" value={form.anoConclusao} onChange={(e) => atualizar("anoConclusao", e.target.value)} placeholder="Ex: 2022 ou Em andamento" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Cursos e certificações<Dica texto="Liste cursos que você fez além da escola. Ex: Informática Básica (FAETEC, 2023), Curso de Confeitaria (2022), Habilitação categoria B. Pode ser curso rápido, workshop, qualquer coisa." /></label>
                <textarea value={form.cursos} onChange={(e) => atualizar("cursos", e.target.value)} placeholder="Ex: Informática Básica (FAETEC, 2023), CNH categoria B..." rows={3} className={`${inputClass} resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEtapa(2)} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">← Voltar</button>
              <button onClick={() => setEtapa(4)} disabled={!form.escolaridade} className="flex-[2] py-4 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 disabled:opacity-40 transition-all">Continuar →</button>
            </div>
          </div>
        )}

        {etapa === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-[#08213E] mb-1">Habilidades</h2>
            <p className="text-gray-500 text-sm mb-6">O que você sabe fazer bem?</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">Suas habilidades<Dica texto="Liste o que você sabe fazer. Exemplos: Pacote Office, Atendimento ao cliente, Direção (CNH B), Vendas, Culinária, Costura, Manutenção elétrica, Redes sociais, Caixa registradora. Não precisa ter diploma pra colocar — se você sabe fazer, coloca." /></label>
                <textarea value={form.habilidades} onChange={(e) => atualizar("habilidades", e.target.value)} placeholder="Ex: Atendimento ao cliente, Pacote Office básico, Operação de caixa, Direção categoria B..." rows={4} className={`${inputClass} resize-none`} />
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-700 leading-relaxed">📄 O sistema vai gerar um currículo profissional em PDF com o logo da Secretaria de São Pedro da Aldeia. O arquivo será baixado e salvo automaticamente no seu perfil.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEtapa(3)} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">← Voltar</button>
              <button onClick={gerarPDF} disabled={!form.habilidades || gerando} className="flex-[2] py-4 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 disabled:opacity-40 transition-all">
                {gerando ? "Gerando PDF..." : "Gerar meu currículo ↓"}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-white/30 text-xs text-center">
        São Pedro da Aldeia · Secretaria de Desenvolvimento Econômico · Gratuito
      </p>
    </main>
  );
}