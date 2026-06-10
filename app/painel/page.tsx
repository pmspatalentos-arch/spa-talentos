"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Vaga = { id: string; titulo: string; descricao: string; setor: string; bairro: string; quantidade: number; };
type Curso = { id: string; nome: string; instituicao: string; area: string; duracao: string; vagas_disponiveis: number; };
type Candidatura = { id: string; vaga_id: string; status: string; observacao: string; local_entrevista: string; data_entrevista: string; vagas_spa?: { titulo: string } };
type Perfil = { nome: string; email: string; telefone: string; cidade: string; bairro: string; escolaridade: string; objetivo_profissional: string; habilidades: string; tem_curriculo: boolean; };

const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
  enviada:      { label: "Enviada",      color: "bg-gray-100 text-gray-600",    icon: "📤" },
  em_analise:   { label: "Em análise",   color: "bg-blue-50 text-blue-600",     icon: "🔍" },
  aprovada:     { label: "Aprovada",     color: "bg-green-50 text-green-700",   icon: "✅" },
  nao_aprovada: { label: "Não aprovada", color: "bg-red-50 text-red-600",       icon: "❌" },
  comparecer:   { label: "Comparecer",   color: "bg-yellow-50 text-yellow-700", icon: "📍" },
};

export default function Painel() {
  const [usuario, setUsuario] = useState<{email?: string | null, nome?: string} | null>(null);
  const [aba, setAba] = useState<"vagas" | "cursos" | "candidaturas" | "perfil">("vagas");
  const [carregando, setCarregando] = useState(true);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [inscricoes, setInscricoes] = useState<string[]>([]);
  const [vagasCandidatadas, setVagasCandidatadas] = useState<string[]>([]);
  const [processando, setProcessando] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState<Perfil>({ nome: "", email: "", telefone: "", cidade: "", bairro: "", escolaridade: "", objetivo_profissional: "", habilidades: "", tem_curriculo: false });
  const router = useRouter();

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400";

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      if (user.email === "admin@spatalentos.gov.br") { router.push("/admin"); return; }
      const nome = user.user_metadata?.nome || user.email;
      setUsuario({ email: user.email, nome });

      const { data: v } = await supabase.from("vagas_spa").select("*").eq("ativa", true).order("criado_em", { ascending: false });
      const { data: c } = await supabase.from("cursos_spa").select("*").eq("ativo", true).order("criado_em", { ascending: false });
      const { data: cand } = await supabase.from("candidaturas").select("*, vagas_spa(titulo)").eq("candidato_email", user.email!);
      const { data: insc } = await supabase.from("inscricoes_spa").select("curso_id").eq("candidato_email", user.email!);
      const { data: p } = await supabase.from("candidatos_temp").select("*").eq("email", user.email!).single();

      if (v) setVagas(v);
      if (c) setCursos(c);
      if (cand) { setCandidaturas(cand); setVagasCandidatadas(cand.map((c: Candidatura) => c.vaga_id)); }
      if (insc) setInscricoes(insc.map((i: {curso_id: string}) => i.curso_id));
      if (p) { setPerfil(p); setFormPerfil(p); }
      setCarregando(false);
    };
    verificar();
  }, [router]);

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const candidatar = async (vaga: Vaga) => {
    if (vagasCandidatadas.includes(vaga.id)) return;
    setProcessando(vaga.id);
    const { error } = await supabase.from("candidaturas").insert([{ vaga_id: vaga.id, candidato_email: usuario?.email, candidato_nome: usuario?.nome, status: "enviada" }]);
    if (!error) { setVagasCandidatadas([...vagasCandidatadas, vaga.id]); mostrarToast(`✅ Candidatura enviada para "${vaga.titulo}"!`); }
    setProcessando(null);
  };

  const inscrever = async (curso: Curso) => {
    if (inscricoes.includes(curso.id)) return;
    setProcessando(curso.id);
    const { error } = await supabase.from("inscricoes_spa").insert([{ curso_id: curso.id, candidato_email: usuario?.email, candidato_nome: usuario?.nome, status: "inscrito" }]);
    if (!error) { setInscricoes([...inscricoes, curso.id]); mostrarToast(`✅ Inscrição realizada em "${curso.nome}"!`); }
    setProcessando(null);
  };

  const salvarPerfil = async () => {
    setSalvandoPerfil(true);
    const { error } = await supabase.from("candidatos_temp").update({
      nome: formPerfil.nome,
      telefone: formPerfil.telefone,
      cidade: formPerfil.cidade,
      bairro: formPerfil.bairro,
      escolaridade: formPerfil.escolaridade,
      objetivo_profissional: formPerfil.objetivo_profissional,
      habilidades: formPerfil.habilidades,
    }).eq("email", usuario?.email!);
    if (!error) {
      setPerfil({ ...perfil!, ...formPerfil });
      setEditando(false);
      mostrarToast("✅ Perfil atualizado com sucesso!");
    }
    setSalvandoPerfil(false);
  };

  const sair = async () => { await supabase.auth.signOut(); router.push("/"); };

  if (carregando) return <main className="min-h-screen bg-[#08213E] flex items-center justify-center"><div className="text-white/50 text-sm">Carregando...</div></main>;

  return (
    <main className="min-h-screen bg-gray-50">
      {toast && <div className="fixed top-6 right-6 z-50 bg-[#08213E] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">{toast}</div>}

      <header className="bg-[#08213E] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img src="/brasao.png" alt="Brasão" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">SPA Talentos</span>
              <span className="text-white/30 text-xs ml-2">São Pedro da Aldeia · RJ</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-xs hidden sm:block">{usuario?.email}</span>
            <button onClick={sair} className="text-white/50 text-xs hover:text-white transition-colors">Sair</button>
          </div>
        </div>
      </header>

      <div className="bg-[#08213E] px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Olá, {usuario?.nome?.split(" ")[0]} 👋</h1>
          <p className="text-white/50 text-sm">Veja as oportunidades disponíveis em São Pedro da Aldeia</p>
          <div className="flex gap-4 mt-6 flex-wrap">
            {[
              { valor: vagas.length, label: "Vagas abertas" },
              { valor: cursos.length, label: "Cursos gratuitos" },
              { valor: candidaturas.length, label: "Minhas candidaturas" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-5 py-3">
                <div className="text-xl font-bold text-white">{s.valor}</div>
                <div className="text-white/40 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {[
            { id: "vagas", label: "🎯 Vagas" },
            { id: "cursos", label: "📚 Cursos" },
            { id: "candidaturas", label: "📋 Candidaturas" },
            { id: "perfil", label: "👤 Meu Perfil" },
          ].map((item) => (
            <button key={item.id} onClick={() => setAba(item.id as "vagas" | "cursos" | "candidaturas" | "perfil")}
              className={`px-5 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${aba === item.id ? "border-yellow-400 text-[#08213E]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">

          {aba === "vagas" && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-6">Vagas disponíveis em SPA</h2>
              {vagas.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">🎯</div><p>Nenhuma vaga disponível no momento</p></div>
              ) : (
                <div className="grid gap-4">
                  {vagas.map((v) => {
                    const jaCandidatou = vagasCandidatadas.includes(v.id);
                    return (
                      <div key={v.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">Nova</span>
                          {v.setor && <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">{v.setor}</span>}
                          {jaCandidatou && <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">✓ Candidatura enviada</span>}
                        </div>
                        <h3 className="font-bold text-gray-800 text-base">{v.titulo}</h3>
                        <p className="text-gray-500 text-sm mt-1">{v.descricao}</p>
                        <div className="flex gap-2 mt-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">📍 {v.bairro || "São Pedro da Aldeia"}</span>
                          <span className="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full font-medium">{v.quantidade} vaga(s)</span>
                        </div>
                        <button onClick={() => candidatar(v)} disabled={jaCandidatou || processando === v.id}
                          className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all ${jaCandidatou ? "bg-green-50 text-green-600 cursor-default" : "bg-yellow-400 text-[#08213E] hover:bg-yellow-300"} disabled:opacity-60`}>
                          {processando === v.id ? "Enviando..." : jaCandidatou ? "✓ Candidatura enviada" : "Me candidatar →"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {aba === "cursos" && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-6">Cursos gratuitos disponíveis</h2>
              {cursos.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📚</div><p>Nenhum curso disponível no momento</p></div>
              ) : (
                <div className="grid gap-4">
                  {cursos.map((c) => {
                    const jaInscrito = inscricoes.includes(c.id);
                    return (
                      <div key={c.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">📚</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.instituicao}</span>
                              <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">✓ Gratuito</span>
                              {jaInscrito && <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">✓ Inscrito</span>}
                            </div>
                            <h3 className="font-bold text-gray-800">{c.nome}</h3>
                            <p className="text-gray-500 text-sm mt-1">{c.area} {c.duracao && `· ${c.duracao}`}</p>
                            {c.vagas_disponiveis && <p className="text-xs text-gray-400 mt-1">{c.vagas_disponiveis} vagas disponíveis</p>}
                          </div>
                        </div>
                        <button onClick={() => inscrever(c)} disabled={jaInscrito || processando === c.id}
                          className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all ${jaInscrito ? "bg-purple-50 text-purple-600 cursor-default" : "border-2 border-yellow-400 text-[#08213E] hover:bg-yellow-50"} disabled:opacity-60`}>
                          {processando === c.id ? "Inscrevendo..." : jaInscrito ? "✓ Já inscrito" : "Quero me inscrever →"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {aba === "candidaturas" && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-6">Minhas candidaturas</h2>
              {candidaturas.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-medium">Você ainda não se candidatou a nenhuma vaga</p>
                  <button onClick={() => setAba("vagas")} className="mt-4 px-6 py-2 bg-yellow-400 text-[#08213E] font-bold text-sm rounded-xl">Ver vagas disponíveis</button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {candidaturas.map((c) => {
                    const st = STATUS_INFO[c.status] || STATUS_INFO.enviada;
                    return (
                      <div key={c.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-800">{c.vagas_spa?.titulo || "Vaga"}</h3>
                            <p className="text-gray-500 text-xs mt-1">São Pedro da Aldeia</p>
                          </div>
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${st.color}`}>{st.icon} {st.label}</span>
                        </div>
                        {c.status === "comparecer" && c.local_entrevista && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-xl">
                            <p className="text-yellow-800 text-sm font-semibold">📍 Local: {c.local_entrevista}</p>
                            {c.data_entrevista && <p className="text-yellow-700 text-xs mt-1">🕐 {new Date(c.data_entrevista).toLocaleString("pt-BR")}</p>}
                          </div>
                        )}
                        {c.observacao && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                            <p className="text-gray-600 text-sm">💬 {c.observacao}</p>
                          </div>
                        )}
                        {(c.status === "aprovada" || c.status === "comparecer") && (
                          <a href={`/carta?id=${c.id}`} target="_blank">
                            <button className="mt-4 w-full py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-all">
                              📄 Baixar minha carta de encaminhamento
                            </button>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {aba === "perfil" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">Meu perfil</h2>
                {!editando && (
                  <button onClick={() => setEditando(true)} className="px-4 py-2 bg-yellow-400 text-[#08213E] font-bold text-sm rounded-xl hover:bg-yellow-300 transition-all">
                    ✏️ Editar perfil
                  </button>
                )}
              </div>

              {!editando ? (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                      {perfil?.nome?.charAt(0).toUpperCase() || usuario?.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{perfil?.nome || usuario?.nome}</h3>
                      <p className="text-gray-500 text-sm">{usuario?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Telefone</p>
                      <p className="text-sm font-medium text-gray-700">{perfil?.telefone || "Não informado"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Bairro</p>
                      <p className="text-sm font-medium text-gray-700">{perfil?.bairro || "Não informado"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Cidade</p>
                      <p className="text-sm font-medium text-gray-700">{perfil?.cidade || "São Pedro da Aldeia"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Escolaridade</p>
                      <p className="text-sm font-medium text-gray-700">{perfil?.escolaridade?.replace(/_/g, " ") || "Não informada"}</p>
                    </div>
                  </div>

                  {perfil?.objetivo_profissional && (
                    <div className="p-4 bg-blue-50 rounded-xl mb-4">
                      <p className="text-xs text-blue-400 mb-1">Objetivo profissional</p>
                      <p className="text-sm text-blue-800">{perfil.objetivo_profissional}</p>
                    </div>
                  )}

                  {perfil?.habilidades && (
                    <div className="p-4 bg-green-50 rounded-xl mb-6">
                      <p className="text-xs text-green-400 mb-1">Habilidades</p>
                      <p className="text-sm text-green-800">{perfil.habilidades}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <div className="text-xl font-bold text-[#08213E]">{candidaturas.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Candidaturas</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <div className="text-xl font-bold text-[#08213E]">{inscricoes.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Cursos inscritos</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Meu currículo</p>
                    <a href="/curriculo">
                      <button className="px-5 py-3 bg-yellow-400 text-[#08213E] font-bold text-sm rounded-xl hover:bg-yellow-300 transition-all">
                        {candidaturas.length > 0 ? "✏️ Atualizar currículo" : "📄 Criar meu currículo"}
                      </button>
                    </a>
                    {candidaturas.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">⚠️ Edições no currículo não afetam candidaturas anteriores.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-5">Editar informações</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Nome completo</label>
                      <input type="text" value={formPerfil.nome} onChange={(e) => setFormPerfil({...formPerfil, nome: e.target.value})} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label>
                        <input type="tel" value={formPerfil.telefone} onChange={(e) => setFormPerfil({...formPerfil, telefone: e.target.value})} placeholder="(22) 99999-9999" className={inputClass} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Bairro</label>
                        <input type="text" value={formPerfil.bairro} onChange={(e) => setFormPerfil({...formPerfil, bairro: e.target.value})} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade</label>
                      <input type="text" value={formPerfil.cidade} onChange={(e) => setFormPerfil({...formPerfil, cidade: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Escolaridade</label>
                      <select value={formPerfil.escolaridade} onChange={(e) => setFormPerfil({...formPerfil, escolaridade: e.target.value})} className={inputClass}>
                        <option value="">Selecione...</option>
                        <option value="fundamental_incompleto">Fundamental incompleto</option>
                        <option value="fundamental_completo">Fundamental completo</option>
                        <option value="medio_incompleto">Médio incompleto</option>
                        <option value="medio_completo">Médio completo</option>
                        <option value="tecnico">Técnico</option>
                        <option value="superior_incompleto">Superior incompleto</option>
                        <option value="superior_completo">Superior completo</option>
                        <option value="pos_graduacao">Pós-graduação</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Objetivo profissional</label>
                      <textarea value={formPerfil.objetivo_profissional} onChange={(e) => setFormPerfil({...formPerfil, objetivo_profissional: e.target.value})} rows={3} placeholder="Ex: Busco oportunidade na área de vendas..." className={`${inputClass} resize-none`} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Habilidades</label>
                      <textarea value={formPerfil.habilidades} onChange={(e) => setFormPerfil({...formPerfil, habilidades: e.target.value})} rows={3} placeholder="Ex: Atendimento ao cliente, Pacote Office, CNH B..." className={`${inputClass} resize-none`} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => { setEditando(false); setFormPerfil(perfil!); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancelar</button>
                    <button onClick={salvarPerfil} disabled={salvandoPerfil} className="flex-[2] py-3 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 disabled:opacity-40 transition-all">
                      {salvandoPerfil ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}