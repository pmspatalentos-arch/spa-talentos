"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

function CadastroForm() {
  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "São Pedro da Aldeia",
    bairro: "",
    senha: "",
    confirmarSenha: "",
  });
  const [curriculo, setCurriculo] = useState<File | null>(null);
  const [temCurriculo, setTemCurriculo] = useState<boolean | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const origem = params.get("origem");

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400";
  const atualizar = (campo: string, valor: string) => setForm(prev => ({ ...prev, [campo]: valor }));

  const finalizarCadastro = async () => {
    if (form.senha !== form.confirmarSenha) { setErro("As senhas não coincidem."); return; }
    if (form.senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    setCarregando(true);
    setErro("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: { data: { nome: form.nome } },
      });
      if (authError) throw authError;

      let curriculoUrl = null;
      if (curriculo && authData.user) {
        const nomeArquivo = `${authData.user.id}_${Date.now()}.pdf`;
        const { data: upload } = await supabase.storage.from("curriculos").upload(nomeArquivo, curriculo);
        if (upload) curriculoUrl = nomeArquivo;
      }

      await supabase.from("candidatos_temp").insert([{
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        cidade: form.cidade,
        bairro: form.bairro,
        tem_curriculo: !!curriculoUrl,
        curriculo_url: curriculoUrl,
        curriculo_gerado: false,
        user_id: authData.user?.id,
        criado_em: new Date().toISOString(),
      }]);

      router.push(origem === "mural" ? "/mural" : "/painel");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar conta.";
      setErro(msg.includes("already registered") ? "Este e-mail já está cadastrado." : msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08213E] flex flex-col items-center justify-center px-4 py-12">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500/8 blur-3xl -top-20 -right-20 animate-pulse" />
        <div className="absolute w-80 h-80 rounded-full bg-yellow-400/6 blur-3xl -bottom-20 -left-20 animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg">
              <Image src="/brasao.png" alt="Brasão SPA" width={40} height={40} className="object-contain" />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-lg leading-none">SPA Talentos</div>
              <div className="text-white/40 text-xs">São Pedro da Aldeia · RJ</div>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">Crie sua conta grátis</h1>
          <p className="text-white/40 text-sm">Conecte-se às oportunidades da sua cidade</p>
        </div>

        {/* Progresso */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= etapa ? "bg-yellow-400" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-2xl">

          {/* ETAPA 1 — Dados pessoais */}
          {etapa === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#08213E] mb-1">Seus dados</h2>
              <p className="text-gray-500 text-sm mb-6">Preencha seus dados básicos para criar a conta.</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nome completo</label>
                  <input type="text" value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} placeholder="Seu nome completo" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => atualizar("email", e.target.value)} placeholder="seu@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone / WhatsApp</label>
                  <input type="tel" value={form.telefone} onChange={(e) => atualizar("telefone", e.target.value)} placeholder="(22) 99999-9999" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade</label>
                    <input type="text" value={form.cidade} onChange={(e) => atualizar("cidade", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Bairro</label>
                    <input type="text" value={form.bairro} onChange={(e) => atualizar("bairro", e.target.value)} placeholder="Ex: Centro" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Senha</label>
                  <input type="password" value={form.senha} onChange={(e) => atualizar("senha", e.target.value)} placeholder="Mínimo 6 caracteres" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmar senha</label>
                  <input type="password" value={form.confirmarSenha} onChange={(e) => atualizar("confirmarSenha", e.target.value)} placeholder="Repita a senha" className={inputClass} />
                </div>
              </div>

              {erro && <p className="mt-3 text-red-500 text-sm text-center">{erro}</p>}

              <button
                onClick={() => {
                  if (!form.nome || !form.email || !form.telefone || !form.bairro || !form.senha || !form.confirmarSenha) { setErro("Preencha todos os campos."); return; }
                  if (form.senha !== form.confirmarSenha) { setErro("As senhas não coincidem."); return; }
                  if (form.senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
                  setErro("");
                  setEtapa(2);
                }}
                disabled={!form.nome || !form.email || !form.telefone || !form.bairro || !form.senha || !form.confirmarSenha}
                className="mt-6 w-full py-4 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 transition-all disabled:opacity-40"
              >
                Continuar →
              </button>
            </div>
          )}

          {/* ETAPA 2 — Currículo */}
          {etapa === 2 && (
            <div>
              <h2 className="text-xl font-bold text-[#08213E] mb-1">Seu currículo</h2>
              <p className="text-gray-500 text-sm mb-6">Você tem um currículo em PDF?</p>

              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={() => setTemCurriculo(true)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${temCurriculo === true ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${temCurriculo === true ? "border-yellow-400 bg-yellow-400" : "border-gray-300"}`}>
                      {temCurriculo === true && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-[#08213E] text-sm">Sim, tenho currículo em PDF</div>
                      <div className="text-gray-500 text-xs mt-0.5">Vou fazer o upload agora</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setTemCurriculo(false); setCurriculo(null); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${temCurriculo === false ? "border-yellow-400 bg-yellow-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${temCurriculo === false ? "border-yellow-400 bg-yellow-400" : "border-gray-300"}`}>
                      {temCurriculo === false && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-[#08213E] text-sm">Não tenho currículo</div>
                      <div className="text-gray-500 text-xs mt-0.5">Posso criar um pelo sistema depois</div>
                    </div>
                  </div>
                </button>
              </div>

              {temCurriculo === true && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Selecione o arquivo PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCurriculo(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-yellow-50 file:text-yellow-700 file:font-semibold hover:file:bg-yellow-100"
                  />
                  {curriculo && <p className="text-green-600 text-xs mt-2">✓ {curriculo.name}</p>}
                </div>
              )}

              {temCurriculo === false && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-700 text-xs leading-relaxed">
                    💡 Após o cadastro você pode criar seu currículo gratuitamente pelo sistema. O SPA Talentos gera um PDF profissional com o logo da Prefeitura.
                  </p>
                </div>
              )}

              {erro && <p className="mb-3 text-red-500 text-sm text-center">{erro}</p>}

              <div className="flex gap-3">
                <button onClick={() => setEtapa(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">← Voltar</button>
                <button
                  onClick={finalizarCadastro}
                  disabled={temCurriculo === null || (temCurriculo === true && !curriculo) || carregando}
                  className="flex-[2] py-3 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 disabled:opacity-40 transition-all"
                >
                  {carregando ? "Criando conta..." : "Finalizar cadastro →"}
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="mt-6 text-center text-white/40 text-sm">
          Já tem cadastro?{" "}
          <a href="/login" className="text-yellow-400 font-medium hover:text-yellow-300">Entrar</a>
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <span className="text-white/20 text-xs">Prefeitura SPA</span>
          <span className="text-white/20 text-xs">FAETEC</span>
          <span className="text-white/20 text-xs">FIRJAN</span>
        </div>

      </div>
    </main>
  );
}

export default function Cadastro() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  );
}