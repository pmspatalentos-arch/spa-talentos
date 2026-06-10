import { supabase } from "@/lib/supabase";
import Link from "next/link";

async function getDados() {
  const { data: vagas } = await supabase
    .from("vagas_spa")
    .select("*")
    .eq("ativa", true)
    .order("criado_em", { ascending: false });

  const { data: cursos } = await supabase
    .from("cursos_spa")
    .select("*")
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  return { vagas: vagas || [], cursos: cursos || [] };
}

export default async function Mural() {
  const { vagas, cursos } = await getDados();

  return (
    <main className="min-h-screen bg-[#08213E]">

      <div className="px-6 py-8 text-center border-b border-white/10">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">S</div>
          <div className="text-left">
            <div className="text-white font-bold text-lg leading-none">SPA Talentos</div>
            <div className="text-white/40 text-xs">São Pedro da Aldeia · RJ</div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Oportunidades em São Pedro da Aldeia</h1>
        <p className="text-white/50 text-sm max-w-sm mx-auto">Vagas de emprego e cursos gratuitos disponíveis agora para moradores da cidade.</p>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto">

        {/* Vagas */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🎯 Vagas abertas</h2>
            <span className="text-white/40 text-sm">{vagas.length} disponíveis</span>
          </div>

          {vagas.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <p>Nenhuma vaga disponível no momento</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {vagas.map((v: {id: string; titulo: string; descricao: string; setor: string; bairro: string; quantidade: number}) => (
                <div key={v.id} className="bg-white/[0.06] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {v.setor && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">{v.setor}</span>}
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full">{v.quantidade} vaga(s)</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{v.titulo}</h3>
                  <p className="text-white/50 text-sm mt-1">{v.descricao}</p>
                  <p className="text-white/30 text-xs mt-2">📍 {v.bairro || "São Pedro da Aldeia"}</p>
                  <Link href="/login?origem=mural">
                    <button className="mt-4 w-full py-2.5 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 transition-all">
                      Quero me candidatar →
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cursos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">📚 Cursos gratuitos</h2>
            <span className="text-white/40 text-sm">{cursos.length} disponíveis</span>
          </div>

          {cursos.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <p>Nenhum curso disponível no momento</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {cursos.map((c: {id: string; nome: string; instituicao: string; area: string; duracao: string; vagas_disponiveis: number}) => (
                <div key={c.id} className="bg-white/[0.06] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl flex-shrink-0">📚</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">{c.instituicao}</span>
                        <span className="text-xs font-semibold text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full">✓ Gratuito</span>
                      </div>
                      <h3 className="font-bold text-white text-sm">{c.nome}</h3>
                      <p className="text-white/40 text-xs mt-1">{c.area} {c.duracao && `· ${c.duracao}`}</p>
                      {c.vagas_disponiveis && <p className="text-white/30 text-xs mt-1">{c.vagas_disponiveis} vagas disponíveis</p>}
                    </div>
                  </div>
                  <Link href="/login?origem=mural">
                    <button className="mt-4 w-full py-2.5 rounded-xl border border-yellow-400/50 text-yellow-400 font-bold text-sm hover:bg-yellow-400/10 transition-all">
                      Quero me inscrever →
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center border-t border-white/10 pt-8">
          <p className="text-white/30 text-xs">Secretaria de Desenvolvimento Econômico · São Pedro da Aldeia · RJ</p>
          <p className="text-white/20 text-xs mt-1">Sistema gratuito para todos os moradores</p>
        </div>

      </div>
    </main>
  );
}