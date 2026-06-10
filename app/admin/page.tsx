"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Vaga = {
  id: string; titulo: string; descricao: string; setor: string;
  bairro: string; quantidade: number; contratacoes: number; criado_em: string;
  escolaridade_minima: string; habilidades_desejadas: string;
  area_experiencia: string; disponibilidade_exigida: string; ativa: boolean;
};

type Curso = {
  id: string; nome: string; instituicao: string; area: string;
  duracao: string; vagas_disponiveis: number; data_inicio: string;
};

type Candidato = {
  id: string; nome: string; email: string; bairro: string;
  escolaridade: string; habilidades: string; tem_curriculo: boolean;
  objetivo_profissional: string;
};

type Candidatura = {
  id: string; candidato_nome: string; candidato_email: string;
  status: string; observacao: string; local_entrevista: string;
  data_entrevista: string; vaga_id: string; score?: number;
};

const ADMIN_EMAIL = "admin@spatalentos.gov.br";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  enviada:      { label: "Enviada",      color: "bg-gray-100 text-gray-600" },
  em_analise:   { label: "Em análise",   color: "bg-blue-50 text-blue-600" },
  aprovada:     { label: "Aprovada",     color: "bg-green-50 text-green-600" },
  nao_aprovada: { label: "Não aprovada", color: "bg-red-50 text-red-600" },
  comparecer:   { label: "Comparecer",   color: "bg-yellow-50 text-yellow-700" },
  contratado:   { label: "Contratado",   color: "bg-purple-50 text-purple-700" },
};

const calcularScore = (candidato: Candidato, vaga: Vaga): number => {
  let score = 0;
  const escolaridades = [
    "fundamental_incompleto", "fundamental_completo",
    "medio_incompleto", "medio_completo", "tecnico",
    "superior_incompleto", "superior_completo", "pos_graduacao"
  ];
  if (vaga.escolaridade_minima && candidato.escolaridade) {
    const nivelCandidato = escolaridades.indexOf(candidato.escolaridade);
    const nivelMinimo = escolaridades.indexOf(vaga.escolaridade_minima);
    if (nivelCandidato >= nivelMinimo) score += 30;
    else if (nivelCandidato === nivelMinimo - 1) score += 15;
  } else { score += 30; }
  if (vaga.habilidades_desejadas && candidato.habilidades) {
    const habilidadesVaga = vaga.habilidades_desejadas.toLowerCase().split(/[,;]+/).map(h => h.trim());
    const habilidadesCandidato = candidato.habilidades.toLowerCase();
    const matches = habilidadesVaga.filter(h => habilidadesCandidato.includes(h)).length;
    score += Math.round((matches / habilidadesVaga.length) * 25);
  } else { score += 25; }
  if (vaga.area_experiencia && candidato.objetivo_profissional) {
    const area = vaga.area_experiencia.toLowerCase();
    const objetivo = candidato.objetivo_profissional.toLowerCase();
    if (objetivo.includes(area)) score += 25;
    else if (area.split(" ").some(p => objetivo.includes(p))) score += 12;
  } else { score += 25; }
  if (candidato.tem_curriculo) score += 20;
  return Math.min(score, 100);
};

const corScore = (score: number) => {
  if (score >= 70) return "bg-green-50 text-green-700";
  if (score >= 40) return "bg-yellow-50 text-yellow-700";
  return "bg-red-50 text-red-600";
};

export default function Admin() {
  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [aba, setAba] = useState<"vagas" | "cursos" | "candidatos" | "por_vaga">("vagas");
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);
  const [modalVaga, setModalVaga] = useState(false);
  const [modalCurso, setModalCurso] = useState(false);
  const [modalStatus, setModalStatus] = useState<Candidatura | null>(null);
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  const [novaVaga, setNovaVaga] = useState({
    titulo: "", descricao: "", setor: "", bairro: "", quantidade: 1,
    escolaridade_minima: "", habilidades_desejadas: "", area_experiencia: "", disponibilidade_exigida: "",
  });

  const [novoCurso, setNovoCurso] = useState({
    nome: "", instituicao: "FAETEC", area: "", duracao: "", vagas_disponiveis: 20, data_inicio: "",
  });

  const [editStatus, setEditStatus] = useState({
    status: "enviada", observacao: "", local_entrevista: "", data_entrevista: "",
  });

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400";

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) { router.push("/login"); return; }
      setAutorizado(true);
      setVerificando(false);
      await carregarDados();
    };
    verificar();
  }, [router]);

  const carregarDados = async () => {
    const { data: v } = await supabase.from("vagas_spa").select("*").order("criado_em", { ascending: false });
    const { data: c } = await supabase.from("cursos_spa").select("*").order("criado_em", { ascending: false });
    const { data: cd } = await supabase.from("candidatos_temp").select("*").order("criado_em", { ascending: false });
    const { data: cand } = await supabase.from("candidaturas").select("*").order("criado_em", { ascending: false });
    if (v) setVagas(v);
    if (c) setCursos(c);
    if (cd) setCandidatos(cd);
    if (cand) setCandidaturas(cand);
  };

  const carregarCandidaturasPorVaga = (vaga: Vaga) => {
    setVagaSelecionada(vaga);
    setAba("por_vaga");
  };

  const registrarContratacao = async (candidatura: Candidatura) => {
    setSalvando(true);

    // Atualiza status da candidatura para contratado
    await supabase.from("candidaturas").update({ status: "contratado" }).eq("id", candidatura.id);

    // Busca vaga atual
    const { data: vaga } = await supabase.from("vagas_spa").select("quantidade, contratacoes").eq("id", candidatura.vaga_id).single();

    if (vaga) {
      const novasContratacoes = (vaga.contratacoes || 0) + 1;
      const vagasRestantes = vaga.quantidade - novasContratacoes;

      // Se não tem mais vagas, desativa automaticamente
      await supabase.from("vagas_spa").update({
        contratacoes: novasContratacoes,
        ativa: vagasRestantes > 0,
      }).eq("id", candidatura.vaga_id);
    }

    await carregarDados();
    setSalvando(false);
  };

  const salvarStatus = async () => {
    if (!modalStatus) return;
    setSalvando(true);
    const { error } = await supabase.from("candidaturas").update({
      status: editStatus.status,
      observacao: editStatus.observacao,
      local_entrevista: editStatus.local_entrevista,
      data_entrevista: editStatus.data_entrevista || null,
    }).eq("id", modalStatus.id);

    if (!error) {
      if (editStatus.status === "aprovada" || editStatus.status === "comparecer") {
        const vaga = vagas.find(v => v.id === modalStatus.vaga_id);
        await fetch("/api/enviar-carta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidato_nome: modalStatus.candidato_nome,
            candidato_email: modalStatus.candidato_email,
            vaga_titulo: vaga?.titulo || "Vaga",
            vaga_setor: vaga?.setor || "",
            codigo: modalStatus.id.substring(0, 8).toUpperCase(),
          }),
        });
      }
      await carregarDados();
      setModalStatus(null);
    }
    setSalvando(false);
  };

  const salvarVaga = async () => {
    setSalvando(true);
    const { error } = await supabase.from("vagas_spa").insert([{
      ...novaVaga, ativa: true, contratacoes: 0, criado_em: new Date().toISOString(),
    }]);
    if (!error) {
      setModalVaga(false);
      setNovaVaga({ titulo: "", descricao: "", setor: "", bairro: "", quantidade: 1, escolaridade_minima: "", habilidades_desejadas: "", area_experiencia: "", disponibilidade_exigida: "" });
      await carregarDados();
    }
    setSalvando(false);
  };

  const salvarCurso = async () => {
    setSalvando(true);
    const { error } = await supabase.from("cursos_spa").insert([{
      ...novoCurso, data_inicio: novoCurso.data_inicio || null, gratuito: true, ativo: true, criado_em: new Date().toISOString(),
    }]);
    if (!error) {
      setModalCurso(false);
      setNovoCurso({ nome: "", instituicao: "FAETEC", area: "", duracao: "", vagas_disponiveis: 20, data_inicio: "" });
      await carregarDados();
    }
    setSalvando(false);
  };

  const sair = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const candidaturasDaVaga = candidaturas
    .filter(c => c.vaga_id === vagaSelecionada?.id)
    .map(c => {
      const candidato = candidatos.find(cd => cd.email === c.candidato_email);
      const score = candidato && vagaSelecionada ? calcularScore(candidato, vagaSelecionada) : 0;
      return { ...c, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  if (verificando) return <main className="min-h-screen bg-[#08213E] flex items-center justify-center"><div className="text-white/50 text-sm">Verificando acesso...</div></main>;
  if (!autorizado) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-[#08213E] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img src="/brasao.png" alt="Brasão" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">SPA Talentos</span>
              <span className="ml-2 text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">Secretaria</span>
            </div>
          </div>
          <button onClick={sair} className="text-white/50 text-xs hover:text-white transition-colors">Sair</button>
        </div>
      </header>

      <div className="bg-[#08213E] px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-white mb-6">Painel da Secretaria</h1>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Candidatos", valor: candidatos.length, icon: "👥" },
              { label: "Vagas publicadas", valor: vagas.filter(v => v.ativa).length, icon: "🎯" },
              { label: "Cursos disponíveis", valor: cursos.length, icon: "📚" },
              { label: "Candidaturas", valor: candidaturas.length, icon: "📋" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white/10 rounded-2xl p-5">
                <div className="text-2xl mb-2">{kpi.icon}</div>
                <div className="text-3xl font-bold text-white">{kpi.valor}</div>
                <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex">
          {[
            { id: "vagas", label: "🎯 Vagas" },
            { id: "cursos", label: "📚 Cursos" },
            { id: "candidatos", label: "👥 Candidatos" },
            { id: "por_vaga", label: "📋 Por vaga" },
          ].map((item) => (
            <button key={item.id} onClick={() => setAba(item.id as "vagas" | "cursos" | "candidatos" | "por_vaga")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${aba === item.id ? "border-yellow-400 text-[#08213E]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">

          {aba === "vagas" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">Vagas publicadas</h2>
                <button onClick={() => setModalVaga(true)} className="px-5 py-2.5 bg-yellow-400 text-[#08213E] font-bold text-sm rounded-xl hover:bg-yellow-300 transition-all">+ Nova vaga</button>
              </div>
              {vagas.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">🎯</div><p>Nenhuma vaga publicada ainda</p></div>
              ) : (
                <div className="grid gap-4">
                  {vagas.map((v) => {
                    const total = candidaturas.filter(c => c.vaga_id === v.id).length;
                    const vagasRestantes = v.quantidade - (v.contratacoes || 0);
                    return (
                      <div key={v.id} className={`bg-white rounded-2xl p-6 border shadow-sm ${!v.ativa ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-800">{v.titulo}</h3>
                              {!v.ativa && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-semibold">Encerrada</span>}
                            </div>
                            <p className="text-gray-500 text-sm mt-1">{v.descricao}</p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {v.setor && <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">{v.setor}</span>}
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{v.bairro || "São Pedro da Aldeia"}</span>
                              <span className="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full">{vagasRestantes} vaga(s) restante(s)</span>
                              {v.contratacoes > 0 && <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">✓ {v.contratacoes} contratado(s)</span>}
                            </div>
                          </div>
                          <button onClick={() => carregarCandidaturasPorVaga(v)} className="ml-4 px-4 py-2 bg-[#08213E] text-white text-xs font-semibold rounded-xl hover:bg-[#0a2d56] transition-all flex-shrink-0">
                            Ver candidatos ({total})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {aba === "por_vaga" && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setAba("vagas")} className="text-gray-500 hover:text-gray-800 text-sm">← Voltar</button>
                <h2 className="text-lg font-bold text-gray-800">Candidatos para: <span className="text-[#08213E]">{vagaSelecionada?.titulo}</span></h2>
              </div>
              <p className="text-xs text-gray-400 mb-6">Ordenados por compatibilidade — do mais ao menos adequado.</p>
              {candidaturasDaVaga.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📋</div><p>Nenhum candidato para esta vaga ainda</p></div>
              ) : (
                <div className="grid gap-3">
                  {candidaturasDaVaga.map((c, i) => {
                    const st = STATUS_LABELS[c.status] || STATUS_LABELS.enviada;
                    return (
                      <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">{i + 1}º</div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {c.candidato_nome?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{c.candidato_nome}</p>
                              <p className="text-gray-500 text-xs">{c.candidato_email}</p>
                              {c.status === "comparecer" && c.local_entrevista && (
                                <p className="text-yellow-700 text-xs mt-1">📍 {c.local_entrevista}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${corScore(c.score || 0)}`}>
                              {c.score}% compatível
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${st.color}`}>{st.label}</span>
                            {(c.status === "aprovada" || c.status === "comparecer") && (
                              <a href={`/carta?id=${c.id}`} target="_blank">
                                <button className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-all">
                                  📄 Carta
                                </button>
                              </a>
                            )}
                            {(c.status === "aprovada" || c.status === "comparecer") && c.status !== "contratado" && (
                              <button
                                onClick={() => registrarContratacao(c)}
                                disabled={salvando}
                                className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 transition-all disabled:opacity-40"
                              >
                                ✓ Contratado
                              </button>
                            )}
                            {c.status !== "contratado" && (
                              <button
                                onClick={() => { setModalStatus(c); setEditStatus({ status: c.status || "enviada", observacao: c.observacao || "", local_entrevista: c.local_entrevista || "", data_entrevista: c.data_entrevista || "" }); }}
                                className="px-3 py-1.5 bg-yellow-400 text-[#08213E] text-xs font-bold rounded-lg hover:bg-yellow-300 transition-all"
                              >
                                Atualizar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {aba === "cursos" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">Cursos disponíveis</h2>
                <button onClick={() => setModalCurso(true)} className="px-5 py-2.5 bg-yellow-400 text-[#08213E] font-bold text-sm rounded-xl hover:bg-yellow-300 transition-all">+ Novo curso</button>
              </div>
              {cursos.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📚</div><p>Nenhum curso cadastrado ainda</p></div>
              ) : (
                <div className="grid gap-4">
                  {cursos.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">📚</div>
                        <div>
                          <div className="flex gap-2 mb-1">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.instituicao}</span>
                            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Gratuito</span>
                          </div>
                          <h3 className="font-bold text-gray-800">{c.nome}</h3>
                          <p className="text-gray-500 text-sm mt-1">{c.area} {c.duracao && `· ${c.duracao}`}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {aba === "candidatos" && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-6">Candidatos cadastrados</h2>
              {candidatos.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">👥</div><p>Nenhum candidato ainda</p></div>
              ) : (
                <div className="grid gap-3">
                  {candidatos.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {c.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{c.nome}</p>
                          <p className="text-gray-500 text-xs">{c.email} · {c.bairro}</p>
                          {c.habilidades && <p className="text-gray-400 text-xs mt-1 truncate max-w-xs">{c.habilidades}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{c.escolaridade?.replace(/_/g, " ")}</span>
                        {c.tem_curriculo && <span className="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full">📄 Com currículo</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {modalVaga && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl my-8">
            <h3 className="text-xl font-bold text-[#08213E] mb-6">Nova vaga</h3>
            <div className="flex flex-col gap-4">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Título da vaga</label><input type="text" value={novaVaga.titulo} onChange={(e) => setNovaVaga({...novaVaga, titulo: e.target.value})} placeholder="Ex: Operador de Caixa" className={inputClass} /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Descrição</label><textarea value={novaVaga.descricao} onChange={(e) => setNovaVaga({...novaVaga, descricao: e.target.value})} placeholder="Descreva a vaga..." rows={3} className={`${inputClass} resize-none`} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Setor</label><input type="text" value={novaVaga.setor} onChange={(e) => setNovaVaga({...novaVaga, setor: e.target.value})} placeholder="Ex: Comércio..." className={inputClass} /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Quantidade</label><input type="number" value={novaVaga.quantidade} onChange={(e) => setNovaVaga({...novaVaga, quantidade: parseInt(e.target.value)})} min={1} className={inputClass} /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Bairro</label><input type="text" value={novaVaga.bairro} onChange={(e) => setNovaVaga({...novaVaga, bairro: e.target.value})} placeholder="Ex: Centro..." className={inputClass} /></div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Requisitos para o score</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Escolaridade mínima</label>
                    <select value={novaVaga.escolaridade_minima} onChange={(e) => setNovaVaga({...novaVaga, escolaridade_minima: e.target.value})} className={inputClass}>
                      <option value="">Sem requisito</option>
                      <option value="fundamental_incompleto">Fundamental incompleto</option>
                      <option value="fundamental_completo">Fundamental completo</option>
                      <option value="medio_incompleto">Médio incompleto</option>
                      <option value="medio_completo">Médio completo</option>
                      <option value="tecnico">Técnico</option>
                      <option value="superior_incompleto">Superior incompleto</option>
                      <option value="superior_completo">Superior completo</option>
                    </select>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Habilidades desejadas</label><input type="text" value={novaVaga.habilidades_desejadas} onChange={(e) => setNovaVaga({...novaVaga, habilidades_desejadas: e.target.value})} placeholder="Ex: Atendimento, Vendas..." className={inputClass} /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Área de experiência</label><input type="text" value={novaVaga.area_experiencia} onChange={(e) => setNovaVaga({...novaVaga, area_experiencia: e.target.value})} placeholder="Ex: comércio, saúde..." className={inputClass} /></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalVaga(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancelar</button>
              <button onClick={salvarVaga} disabled={!novaVaga.titulo || salvando} className="flex-[2] py-3 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm disabled:opacity-40">{salvando ? "Salvando..." : "Publicar vaga"}</button>
            </div>
          </div>
        </div>
      )}

      {modalCurso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-[#08213E] mb-6">Novo curso</h3>
            <div className="flex flex-col gap-4">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Nome do curso</label><input type="text" value={novoCurso.nome} onChange={(e) => setNovoCurso({...novoCurso, nome: e.target.value})} placeholder="Ex: Informática Básica" className={inputClass} /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Instituição</label><select value={novoCurso.instituicao} onChange={(e) => setNovoCurso({...novoCurso, instituicao: e.target.value})} className={inputClass}><option value="FAETEC">FAETEC</option><option value="FIRJAN">FIRJAN</option><option value="Secretaria">Secretaria Municipal</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Área</label><input type="text" value={novoCurso.area} onChange={(e) => setNovoCurso({...novoCurso, area: e.target.value})} placeholder="Ex: Tecnologia..." className={inputClass} /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Duração</label><input type="text" value={novoCurso.duracao} onChange={(e) => setNovoCurso({...novoCurso, duracao: e.target.value})} placeholder="Ex: 3 meses" className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Vagas</label><input type="number" value={novoCurso.vagas_disponiveis} onChange={(e) => setNovoCurso({...novoCurso, vagas_disponiveis: parseInt(e.target.value)})} min={1} className={inputClass} /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Data de início</label><input type="date" value={novoCurso.data_inicio} onChange={(e) => setNovoCurso({...novoCurso, data_inicio: e.target.value})} className={inputClass} /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalCurso(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancelar</button>
              <button onClick={salvarCurso} disabled={!novoCurso.nome || salvando} className="flex-[2] py-3 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm disabled:opacity-40">{salvando ? "Salvando..." : "Publicar curso"}</button>
            </div>
          </div>
        </div>
      )}

      {modalStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-[#08213E] mb-2">Atualizar status</h3>
            <p className="text-gray-500 text-sm mb-6">{modalStatus.candidato_nome}</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <select value={editStatus.status} onChange={(e) => setEditStatus({...editStatus, status: e.target.value})} className={inputClass}>
                  <option value="enviada">📤 Enviada</option>
                  <option value="em_analise">🔍 Em análise</option>
                  <option value="aprovada">✅ Aprovada</option>
                  <option value="nao_aprovada">❌ Não aprovada</option>
                  <option value="comparecer">📍 Comparecer</option>
                </select>
              </div>
              {editStatus.status === "comparecer" && (
                <>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Local</label><input type="text" value={editStatus.local_entrevista} onChange={(e) => setEditStatus({...editStatus, local_entrevista: e.target.value})} placeholder="Ex: Secretaria, Sala 2" className={inputClass} /></div>
                  <div><label className="text-sm font-medium text-gray-700 mb-1 block">Data e hora</label><input type="datetime-local" value={editStatus.data_entrevista} onChange={(e) => setEditStatus({...editStatus, data_entrevista: e.target.value})} className={inputClass} /></div>
                </>
              )}
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Observação</label><textarea value={editStatus.observacao} onChange={(e) => setEditStatus({...editStatus, observacao: e.target.value})} rows={2} className={`${inputClass} resize-none`} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalStatus(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancelar</button>
              <button onClick={salvarStatus} disabled={salvando} className="flex-[2] py-3 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm disabled:opacity-40">{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}