"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const origem = params.get("origem");

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400";

  const entrar = async () => {
    setCarregando(true);
    setErro("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      if (data.user?.email === "admin@spatalentos.gov.br") {
        router.push("/admin");
      } else {
        router.push("/painel");
      }
    } catch (e: unknown) {
      setErro("E-mail ou senha incorretos. Tente novamente.");
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08213E] flex flex-col items-center justify-center px-4 py-12">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500/10 blur-3xl -top-20 -right-20 animate-pulse" />
        <div className="absolute w-80 h-80 rounded-full bg-yellow-400/10 blur-3xl -bottom-20 -left-20 animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Voltar para o mural se veio de lá */}
        {origem === "mural" && (
          <div className="mb-6">
            <Link href="/mural" className="inline-flex items-center gap-2 text-white/40 text-sm hover:text-white/70 transition-colors">
              ← Voltar para oportunidades
            </Link>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">S</div>
            <div className="text-left">
              <div className="text-white font-bold text-lg leading-none">SPA Talentos</div>
              <div className="text-white/40 text-xs">São Pedro da Aldeia · RJ</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-white/50 text-sm">Entre na sua conta para ver vagas e cursos</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" className={inputClass} onKeyDown={(e) => e.key === "Enter" && entrar()} />
            </div>
          </div>

          {erro && <p className="mb-4 text-red-500 text-sm text-center">{erro}</p>}

          <button onClick={entrar} disabled={!email || !senha || carregando}
            className="w-full py-4 rounded-xl bg-yellow-400 text-[#08213E] font-bold text-sm hover:bg-yellow-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-400/30">
            {carregando ? "Entrando..." : "Entrar →"}
          </button>

          <div className="mt-4 text-center">
            <span className="text-gray-500 text-sm">Esqueceu a senha? </span>
            <a href="#" className="text-blue-600 text-sm font-medium hover:underline">Recuperar</a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/40 text-sm">
            Não tem cadastro?{" "}
            <Link href={origem === "mural" ? "/cadastro?origem=mural" : "/cadastro"} className="text-yellow-400 font-medium hover:text-yellow-300">
              Criar conta grátis
            </Link>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <span className="text-white/20 text-xs uppercase tracking-widest">Parceiros</span>
          <span className="text-white/30 text-xs font-medium">Prefeitura SPA</span>
          <span className="text-white/30 text-xs font-medium">FAETEC</span>
          <span className="text-white/30 text-xs font-medium">FIRJAN</span>
        </div>

      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}