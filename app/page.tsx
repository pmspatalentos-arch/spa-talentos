"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [stats, setStats] = useState({ candidatos: 0, vagas: 0, cursos: 0 });

  useEffect(() => {
    const carregar = async () => {
      const { count: c1 } = await supabase.from("candidatos_temp").select("*", { count: "exact", head: true });
      const { count: c2 } = await supabase.from("vagas_spa").select("*", { count: "exact", head: true }).eq("ativa", true);
      const { count: c3 } = await supabase.from("cursos_spa").select("*", { count: "exact", head: true }).eq("ativo", true);
      setStats({ candidatos: c1 || 0, vagas: c2 || 0, cursos: c3 || 0 });
    };
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#08213E] overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-3 bg-[#08213E]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <Image src="/brasao.png" alt="Brasão SPA" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none">SPA Talentos</div>
              <div className="text-white/40 text-xs leading-none mt-0.5">São Pedro da Aldeia · RJ</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/mural"><button className="text-white/50 text-sm hover:text-white transition-colors px-4 py-2">Ver vagas</button></Link>
            <Link href="/login"><button className="text-white/50 text-sm hover:text-white transition-colors px-4 py-2">Entrar</button></Link>
            <Link href="/cadastro"><button className="bg-yellow-400 text-[#08213E] text-sm font-bold px-5 py-2 rounded-xl hover:bg-yellow-300 transition-all">Cadastrar grátis</button></Link>
          </div>
        </div>
      </header>

      {/* CAMADA 1 — Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-3xl -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-yellow-400/6 blur-3xl bottom-0 -left-20 animate-pulse" style={{animationDelay:"1.5s"}} />
        </div>

        <div className="relative z-10 mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/25 rounded-full text-yellow-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
            Plataforma oficial · Prefeitura de São Pedro da Aldeia
          </span>
        </div>

        <div className="relative z-10 w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-lg shadow-black/20">
          <Image src="/brasao.png" alt="Brasão São Pedro da Aldeia" width={64} height={64} className="object-contain" />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-5">
            Seu próximo emprego
            <br /><span className="text-yellow-400">começa aqui.</span>
          </h1>
          <p className="text-white/55 text-lg max-w-xl mx-auto leading-relaxed">
            A Secretaria de Desenvolvimento Econômico conecta você a um futuro que São Pedro da Aldeia construiu para você.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 mb-14 flex-wrap justify-center">
          <Link href="/cadastro">
            <button className="px-8 py-4 bg-yellow-400 text-[#08213E] font-black text-base rounded-2xl hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20 hover:-translate-y-0.5">
              Quero me cadastrar →
            </button>
          </Link>
          <Link href="/mural">
            <button className="px-8 py-4 border border-white/20 text-white font-semibold text-base rounded-2xl hover:bg-white/8 transition-all">
              Ver vagas abertas
            </button>
          </Link>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 w-full max-w-md">
          {[
            { valor: stats.candidatos, label: "Cadastrados" },
            { valor: stats.vagas, label: "Vagas abertas" },
            { valor: stats.cursos, label: "Cursos gratuitos" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-white">{s.valor}</div>
              <div className="text-white/35 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="text-white/20 text-xs">Role para ver mais</div>
          <div className="w-5 h-8 border border-white/15 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/30 rounded-full" />
          </div>
        </div>
      </section>

      {/* CAMADA 2 — Como funciona */}
      <section className="px-6 py-24 bg-white/2">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">Como funciona</span>
            <h2 className="text-4xl font-black text-white mt-3">Simples como deve ser.</h2>
            <p className="text-white/40 mt-3 max-w-md mx-auto">Três passos para sair do cadastro e chegar na entrevista.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { numero: "01", titulo: "Você se cadastra", desc: "Cria seu perfil em minutos — sem burocracia, sem papel, sem fila. Pelo celular de casa.", icon: "👤", bg: "from-blue-500/15 to-blue-600/8", borda: "border-blue-500/20" },
              { numero: "02", titulo: "A Secretaria conecta", desc: "Empresas trazem vagas. O sistema cruza com seu perfil e você aparece para quem precisa.", icon: "🔗", bg: "from-yellow-400/15 to-yellow-500/8", borda: "border-yellow-400/20" },
              { numero: "03", titulo: "Você é chamado", desc: "Recebe carta oficial da Prefeitura por e-mail. Vai à entrevista com respaldo institucional.", icon: "📄", bg: "from-green-500/15 to-green-600/8", borda: "border-green-500/20" },
            ].map((item) => (
              <div key={item.numero} className={`bg-gradient-to-br ${item.bg} border ${item.borda} rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300`}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-yellow-400/60 text-xs font-bold uppercase tracking-widest mb-2">{item.numero}</div>
                <h3 className="text-white font-bold text-xl mb-3">{item.titulo}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAMADA 3 — Impacto */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center mb-20">
            <div>
              <span className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">Impacto real</span>
              <h2 className="text-4xl font-black text-white mt-3 mb-5 leading-tight">
                Feito para quem mora em<br />São Pedro da Aldeia.
              </h2>
              <p className="text-white/45 leading-relaxed mb-8">
                Não é um aplicativo genérico. É um sistema criado pela Secretaria de Desenvolvimento Econômico para conectar a população local com oportunidades reais na cidade.
              </p>
              <div className="space-y-4">
                {[
                  "Vagas exclusivas de empresas parceiras da Prefeitura",
                  "Cursos gratuitos com FAETEC e FIRJAN",
                  "Carta de encaminhamento oficial para entrevistas",
                  "Currículo profissional gerado pelo sistema",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    </div>
                    <span className="text-white/65 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-white font-semibold text-sm">Perfil completo</span>
                  <span className="text-yellow-400 font-bold text-sm">+40% mais chances</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Dados pessoais", pct: 100 },
                    { label: "Experiência profissional", pct: 75 },
                    { label: "Currículo anexado", pct: 60 },
                    { label: "Habilidades preenchidas", pct: 45 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-white/35 mb-1">
                        <span>{item.label}</span><span>{item.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-500/8 border border-green-500/18 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center text-lg flex-shrink-0">🎉</div>
                <div>
                  <p className="text-white font-semibold text-sm">Candidatura aprovada!</p>
                  <p className="text-white/45 text-xs mt-1 leading-relaxed">A Secretaria encaminhou você para a vaga de Operador de Caixa. Sua carta está disponível.</p>
                  <p className="text-green-400 text-xs mt-2 font-semibold">Baixar carta de encaminhamento →</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/8 pt-12">
            <p className="text-center text-white/25 text-xs uppercase tracking-widest mb-8">Parceiros institucionais</p>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              {["Prefeitura de São Pedro da Aldeia", "FAETEC", "FIRJAN", "Secretaria de Desenvolvimento"].map((p) => (
                <span key={p} className="text-white/25 text-sm font-medium">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-6 py-24 text-center border-t border-white/8">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
            <Image src="/brasao.png" alt="Brasão" width={48} height={48} className="object-contain" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Sua oportunidade está<br /><span className="text-yellow-400">esperando por você.</span>
          </h2>
          <p className="text-white/45 mb-10">Gratuito para todos os moradores de São Pedro da Aldeia.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/cadastro">
              <button className="px-10 py-4 bg-yellow-400 text-[#08213E] font-black text-base rounded-2xl hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20">
                Criar meu cadastro grátis →
              </button>
            </Link>
            <Link href="/mural">
              <button className="px-10 py-4 border border-white/20 text-white font-semibold text-base rounded-2xl hover:bg-white/8 transition-all">
                Ver vagas abertas
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-8 bg-[#061829]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <Image src="/brasao.png" alt="Brasão" width={24} height={24} className="object-contain" />
              </div>
              <div>
                <div className="text-white/60 text-xs font-semibold">SPA Talentos</div>
                <div className="text-white/30 text-xs">Prefeitura de São Pedro da Aldeia · RJ</div>
              </div>
            </div>
            <div className="flex gap-6">
              <Link href="/mural"><span className="text-white/25 text-xs hover:text-white/50 transition-colors cursor-pointer">Vagas</span></Link>
              <Link href="/cadastro"><span className="text-white/25 text-xs hover:text-white/50 transition-colors cursor-pointer">Cadastro</span></Link>
              <Link href="/login"><span className="text-white/25 text-xs hover:text-white/50 transition-colors cursor-pointer">Entrar</span></Link>
            </div>
          </div>
          <div className="border-t border-white/5 pt-5 text-center">
            <p className="text-white/20 text-xs">© 2026 SPA Talentos · Criado por Malcon da Costa Gomes · Secretaria de Desenvolvimento Econômico · Prefeitura de São Pedro da Aldeia · "Qualidade de vida para todos"</p>
          </div>
        </div>
      </footer>

    </main>
  );
}