import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Shield } from "lucide-react";
import { adminApi, authApi, ApiError } from "../../cliente-api";

const tabs = [
  { id: "dashboard", label: "Dashboard Admin" },
  { id: "usuarios", label: "Usuários" },
  { id: "auditoria", label: "Auditoria" },
  { id: "cvm", label: "Ingestão CVM" },
];

const STATUS_COR = {
  concluido: "bg-[#6FCF97]",
  executando: "bg-[#F2C94C]",
  pendente: "bg-[#A7B0BC]",
  falhou: "bg-[#E85C5C]",
};

export default function PainelAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sessao, setSessao] = useState({ email: "", ehAdmin: false });
  const [usuarios, setUsuarios] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [ingestoesCvm, setIngestoesCvm] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      setErro("");
      try {
        const s = await authApi.obterSessao();
        if (!ativo) return;
        if (!s.ehAdmin) {
          navigate("/home", { replace: true });
          return;
        }
        setSessao({ email: s.email, ehAdmin: s.ehAdmin });

        const [resUsuarios, resAuditoria, resCvm] = await Promise.all([
          adminApi.listarUsuarios().catch(() => ({ itens: [] })),
          adminApi.listarAuditoria().catch(() => ({ itens: [] })),
          adminApi.listarIngestoesCvm().catch(() => ({ itens: [] })),
        ]);
        if (!ativo) return;
        setUsuarios(resUsuarios.itens ?? []);
        setAuditoria(resAuditoria.itens ?? []);
        setIngestoesCvm(resCvm.itens ?? []);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          navigate("/home", { replace: true });
          return;
        }
        if (ativo) setErro("Falha ao carregar painel administrativo.");
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [navigate]);

  const resumo = useMemo(
    () => ({
      usuarios: usuarios.length,
      auditoria: auditoria.length,
      cvmExecucoes: ingestoesCvm.length,
      cvmConcluidas: ingestoesCvm.filter((i) => i.status === "concluido").length,
    }),
    [usuarios.length, auditoria.length, ingestoesCvm],
  );

  if (loading) return <p className="text-sm text-[#0B1218]/60">Carregando painel administrativo...</p>;

  return (
    <div className="w-full font-['Inter'] text-[#0B1218]">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-[#F56A2A] mb-2">
          <Shield size={18} />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Admin</span>
        </div>
        <h1 className="font-['Sora'] text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-sm text-[#0B1218]/50 mt-2">Sessão: {sessao.email}</p>
      </div>

      {erro && (
        <div className="mb-4 p-3 border border-[#E85C5C]/30 bg-[#E85C5C]/10 text-[#E85C5C] text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {erro}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-xl transition-all ${activeTab === tab.id ? "bg-[#0B1218] text-white border-[#0B1218] shadow-md shadow-black/10" : "bg-white text-[#0B1218]/60 border-[#EFE7DC] hover:bg-[#FAFAFA]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Usuários" value={resumo.usuarios} />
          <StatCard label="Auditoria (eventos)" value={resumo.auditoria} />
          <StatCard label="Execuções CVM" value={resumo.cvmExecucoes} />
          <StatCard label="CVM concluídas" value={resumo.cvmConcluidas} />
        </div>
      )}

      {activeTab === "usuarios" && (
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between border border-[#EFE7DC] p-3 rounded-xl bg-white">
              <div>
                <p className="text-sm font-semibold">{u.nome}</p>
                <p className="text-xs text-[#0B1218]/60">{u.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-[#0B1218]/40">CPF</p>
                <p className="text-xs font-mono">{u.cpf || "—"}</p>
                <p className="text-[10px] text-[#0B1218]/40 mt-1">{new Date(u.criadoEm).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          ))}
          {usuarios.length === 0 && <p className="text-sm text-[#0B1218]/50">Nenhum usuário cadastrado.</p>}
        </div>
      )}

      {activeTab === "auditoria" && (
        <div className="space-y-2">
          {auditoria.map((log) => (
            <div key={log.id} className="border border-[#EFE7DC] p-3 rounded-xl bg-white">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0B1218]/50">{log.acao}{log.recurso ? ` · ${log.recurso}` : ""}</p>
              <p className="text-xs text-[#0B1218]/60 mt-1">{log.autorEmail} · {new Date(log.ocorridoEm).toLocaleString("pt-BR")}</p>
              <pre className="mt-2 text-[11px] bg-[#FAFAFA] p-2 overflow-x-auto rounded-md">{JSON.stringify(log.dadosJson, null, 2)}</pre>
            </div>
          ))}
          {auditoria.length === 0 && <p className="text-sm text-[#0B1218]/50">Sem eventos de auditoria.</p>}
        </div>
      )}

      {activeTab === "cvm" && (
        <div className="space-y-2">
          {ingestoesCvm.map((exec) => (
            <div key={exec.id} className="border border-[#EFE7DC] p-3 rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COR[exec.status] || "bg-[#A7B0BC]"}`} />
                  <p className="text-xs font-bold uppercase tracking-widest">{exec.modo} · {exec.status}</p>
                </div>
                <p className="text-[10px] text-[#0B1218]/40">{exec.duracaoSegundos ?? "—"}s</p>
              </div>
              <p className="text-xs text-[#0B1218]/60 mt-1">Início: {new Date(exec.iniciadoEm).toLocaleString("pt-BR")}</p>
              {exec.concluidoEm && <p className="text-xs text-[#0B1218]/60">Fim: {new Date(exec.concluidoEm).toLocaleString("pt-BR")}</p>}
              {exec.erro && <p className="text-xs text-[#E85C5C] mt-1"><strong>Erro:</strong> {exec.erro}</p>}
            </div>
          ))}
          {ingestoesCvm.length === 0 && <p className="text-sm text-[#0B1218]/50">Sem execuções CVM registradas.</p>}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value }) => (
  <div className="border border-[#EFE7DC] bg-white p-4 rounded-xl">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">{label}</p>
    <p className="font-['Sora'] text-2xl font-bold mt-2">{value}</p>
  </div>
);
