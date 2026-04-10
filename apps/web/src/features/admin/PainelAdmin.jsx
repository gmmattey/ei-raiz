import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { adminApi, ApiError } from "../../cliente-api";

const tabs = [
  { id: "dashboard", label: "Dashboard Admin" },
  { id: "conteudo", label: "Conteúdo" },
  { id: "menus", label: "Menus" },
  { id: "flags", label: "Feature Flags" },
  { id: "score", label: "Score" },
  { id: "corretoras", label: "Corretoras" },
  { id: "admins", label: "Permissões" },
  { id: "auditoria", label: "Auditoria" },
];

export default function PainelAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [me, setMe] = useState({ email: "", isAdmin: false });

  const [config, setConfig] = useState({ score: {}, flags: {}, menus: [] });
  const [blocos, setBlocos] = useState([]);
  const [corretoras, setCorretoras] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [scoreJson, setScoreJson] = useState("{}");
  const [novoAdminEmail, setNovoAdminEmail] = useState("");

  const carregarTudo = async () => {
    setLoading(true);
    setErro("");
    try {
      const meAdmin = await adminApi.obterMeAdmin();
      if (!meAdmin.isAdmin) {
        navigate("/home", { replace: true });
        return;
      }

      const [cfg, conteudo, listaCorretoras, listaAdmins, logs] = await Promise.all([
        adminApi.obterConfigAdmin(),
        adminApi.obterConteudoAdmin(),
        adminApi.obterCorretorasAdmin(),
        adminApi.listarAdmins(),
        adminApi.listarAuditoria(50),
      ]);

      setMe(meAdmin);
      setConfig(cfg);
      setBlocos(conteudo.blocos ?? []);
      setCorretoras(listaCorretoras ?? []);
      setAdmins(listaAdmins ?? []);
      setAuditoria(logs ?? []);
      setScoreJson(JSON.stringify(cfg.score ?? {}, null, 2));
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        navigate("/home", { replace: true });
        return;
      }
      setErro("Falha ao carregar painel administrativo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarTudo();
  }, []);

  const resumo = useMemo(
    () => ({
      blocos: blocos.length,
      menus: (config.menus ?? []).length,
      flags: Object.keys(config.flags ?? {}).length,
      corretoras: corretoras.length,
      admins: admins.length,
    }),
    [admins.length, blocos.length, config.flags, config.menus, corretoras.length],
  );

  const salvarMenus = async () => {
    setErro("");
    setSucesso("");
    try {
      await adminApi.atualizarMenusAdmin(config.menus);
      setSucesso("Menus salvos com publicação imediata.");
    } catch {
      setErro("Falha ao salvar menus.");
    }
  };

  const salvarFlags = async () => {
    setErro("");
    setSucesso("");
    try {
      await adminApi.atualizarFlagsAdmin(config.flags);
      setSucesso("Feature flags salvas com publicação imediata.");
    } catch {
      setErro("Falha ao salvar feature flags.");
    }
  };

  const salvarScore = async () => {
    setErro("");
    setSucesso("");
    try {
      const parsed = JSON.parse(scoreJson);
      await adminApi.atualizarScoreAdmin(parsed);
      setSucesso("Parâmetros de score salvos.");
    } catch {
      setErro("JSON de score inválido ou falha ao salvar.");
    }
  };

  const salvarConteudo = async () => {
    setErro("");
    setSucesso("");
    try {
      await adminApi.atualizarConteudoAdmin(blocos);
      window.dispatchEvent(new Event("ei:conteudo-atualizado"));
      setSucesso("Conteúdo salvo e publicado.");
    } catch {
      setErro("Falha ao salvar conteúdo.");
    }
  };

  const salvarCorretoras = async () => {
    setErro("");
    setSucesso("");
    try {
      await adminApi.atualizarCorretorasAdmin(corretoras);
      setSucesso("Configuração de corretoras salva.");
    } catch {
      setErro("Falha ao salvar corretoras.");
    }
  };

  const salvarAdmin = async (email, ativo) => {
    setErro("");
    setSucesso("");
    try {
      await adminApi.atualizarAdmin(email, ativo);
      setSucesso("Permissão administrativa atualizada.");
      setNovoAdminEmail("");
      setAdmins(await adminApi.listarAdmins());
    } catch {
      setErro("Falha ao atualizar permissões administrativas.");
    }
  };

  if (loading) return <p className="text-sm text-[#0B1218]/60">Carregando painel administrativo...</p>;

  return (
    <div className="w-full font-['Inter'] text-[#0B1218]">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-[#F56A2A] mb-2">
          <Shield size={18} />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Admin</span>
        </div>
        <h1 className="font-['Sora'] text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-sm text-[#0B1218]/50 mt-2">Sessão: {me.email}</p>
      </div>

      {erro && (
        <div className="mb-4 p-3 border border-[#E85C5C]/30 bg-[#E85C5C]/10 text-[#E85C5C] text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {erro}
        </div>
      )}
      {sucesso && (
        <div className="mb-4 p-3 border border-[#6FCF97]/30 bg-[#6FCF97]/10 text-[#2A8F5C] text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> {sucesso}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border ${activeTab === tab.id ? "bg-[#0B1218] text-white border-[#0B1218]" : "bg-white text-[#0B1218]/60 border-[#EFE7DC]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Blocos de conteúdo" value={resumo.blocos} />
          <StatCard label="Menus" value={resumo.menus} />
          <StatCard label="Feature Flags" value={resumo.flags} />
          <StatCard label="Corretoras" value={resumo.corretoras} />
          <StatCard label="Admins" value={resumo.admins} />
        </div>
      )}

      {activeTab === "conteudo" && (
        <div className="space-y-3">
          <button onClick={salvarConteudo} className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest">
            Salvar conteúdo
          </button>
          {blocos.map((bloco, idx) => (
            <div key={bloco.chave} className="border border-[#EFE7DC] p-3 rounded-sm bg-white">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <input value={bloco.modulo} onChange={(e) => atualizarLista(setBlocos, idx, { modulo: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" placeholder="módulo" />
                <input value={bloco.chave} onChange={(e) => atualizarLista(setBlocos, idx, { chave: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" placeholder="chave" />
                <select value={bloco.tipo} onChange={(e) => atualizarLista(setBlocos, idx, { tipo: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs">
                  <option value="texto">texto</option>
                  <option value="markdown">markdown</option>
                  <option value="json">json</option>
                  <option value="boolean">boolean</option>
                </select>
                <input type="number" value={bloco.ordem} onChange={(e) => atualizarLista(setBlocos, idx, { ordem: Number(e.target.value) || 0 })} className="border border-[#EFE7DC] px-2 py-2 text-xs" placeholder="ordem" />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={Boolean(bloco.visivel)} onChange={(e) => atualizarLista(setBlocos, idx, { visivel: e.target.checked })} />
                  Visível
                </label>
              </div>
              <textarea value={bloco.valor} onChange={(e) => atualizarLista(setBlocos, idx, { valor: e.target.value })} className="mt-2 w-full min-h-[80px] border border-[#EFE7DC] px-2 py-2 text-xs" />
            </div>
          ))}
        </div>
      )}

      {activeTab === "menus" && (
        <div className="space-y-3">
          <button onClick={salvarMenus} className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest">
            Salvar menus
          </button>
          {(config.menus ?? []).map((menu, idx) => (
            <div key={menu.chave} className="grid grid-cols-1 md:grid-cols-5 gap-2 border border-[#EFE7DC] p-3 rounded-sm bg-white">
              <input value={menu.chave} onChange={(e) => atualizarListaObj(setConfig, "menus", idx, { chave: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" />
              <input value={menu.label} onChange={(e) => atualizarListaObj(setConfig, "menus", idx, { label: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" />
              <input value={menu.path} onChange={(e) => atualizarListaObj(setConfig, "menus", idx, { path: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" />
              <input type="number" value={menu.ordem} onChange={(e) => atualizarListaObj(setConfig, "menus", idx, { ordem: Number(e.target.value) || 0 })} className="border border-[#EFE7DC] px-2 py-2 text-xs" />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={Boolean(menu.visivel)} onChange={(e) => atualizarListaObj(setConfig, "menus", idx, { visivel: e.target.checked })} />
                Visível
              </label>
            </div>
          ))}
        </div>
      )}

      {activeTab === "flags" && (
        <div className="space-y-3">
          <button onClick={salvarFlags} className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest">
            Salvar flags
          </button>
          {Object.entries(config.flags ?? {}).map(([chave, valor]) => (
            <label key={chave} className="flex items-center justify-between border border-[#EFE7DC] p-3 rounded-sm bg-white text-sm">
              <span>{chave}</span>
              <input
                type="checkbox"
                checked={Boolean(valor)}
                onChange={(e) => setConfig((prev) => ({ ...prev, flags: { ...prev.flags, [chave]: e.target.checked } }))}
              />
            </label>
          ))}
        </div>
      )}

      {activeTab === "score" && (
        <div className="space-y-3">
          <button onClick={salvarScore} className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest">
            Salvar score
          </button>
          <textarea value={scoreJson} onChange={(e) => setScoreJson(e.target.value)} className="w-full min-h-[360px] border border-[#EFE7DC] p-3 text-xs font-mono" />
        </div>
      )}

      {activeTab === "corretoras" && (
        <div className="space-y-3">
          <button onClick={salvarCorretoras} className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest">
            Salvar corretoras
          </button>
          {corretoras.map((item, idx) => (
            <div key={item.codigo} className="grid grid-cols-1 md:grid-cols-4 gap-2 border border-[#EFE7DC] p-3 rounded-sm bg-white">
              <input value={item.codigo} onChange={(e) => atualizarLista(setCorretoras, idx, { codigo: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" />
              <input value={item.nome} onChange={(e) => atualizarLista(setCorretoras, idx, { nome: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" />
              <select value={item.status} onChange={(e) => atualizarLista(setCorretoras, idx, { status: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs">
                <option value="ativo">ativo</option>
                <option value="beta">beta</option>
                <option value="planejado">planejado</option>
              </select>
              <input value={item.mensagemAjuda} onChange={(e) => atualizarLista(setCorretoras, idx, { mensagemAjuda: e.target.value })} className="border border-[#EFE7DC] px-2 py-2 text-xs" />
            </div>
          ))}
        </div>
      )}

      {activeTab === "admins" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={novoAdminEmail}
              onChange={(e) => setNovoAdminEmail(e.target.value)}
              placeholder="email@dominio.com"
              className="flex-1 border border-[#EFE7DC] px-3 py-2 text-sm"
            />
            <button onClick={() => novoAdminEmail && salvarAdmin(novoAdminEmail, true)} className="px-4 py-2 bg-[#0B1218] text-white text-[10px] font-bold uppercase tracking-widest">
              Adicionar admin
            </button>
          </div>
          {admins.map((admin) => (
            <div key={admin.email} className="flex items-center justify-between border border-[#EFE7DC] p-3 rounded-sm bg-white">
              <div>
                <p className="text-sm font-semibold">{admin.email}</p>
                <p className="text-xs text-[#0B1218]/50">concedido por: {admin.concedidoPor || "n/d"}</p>
              </div>
              <button
                onClick={() => salvarAdmin(admin.email, !admin.ativo)}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${admin.ativo ? "bg-[#E85C5C]/10 text-[#E85C5C]" : "bg-[#6FCF97]/10 text-[#2A8F5C]"}`}
              >
                {admin.ativo ? "Desativar" : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "auditoria" && (
        <div className="space-y-2">
          {auditoria.map((log) => (
            <div key={log.id} className="border border-[#EFE7DC] p-3 rounded-sm bg-white">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0B1218]/50">{log.acao} · {log.alvo}</p>
              <p className="text-xs text-[#0B1218]/60 mt-1">{log.autorEmail} · {new Date(log.criadoEm).toLocaleString("pt-BR")}</p>
              <pre className="mt-2 text-[11px] bg-[#FAFAFA] p-2 overflow-x-auto">{log.payloadJson}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value }) => (
  <div className="border border-[#EFE7DC] bg-white p-4 rounded-sm">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/40">{label}</p>
    <p className="font-['Sora'] text-2xl font-bold mt-2">{value}</p>
  </div>
);

function atualizarLista(setter, idx, patch) {
  setter((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
}

function atualizarListaObj(setter, key, idx, patch) {
  setter((prev) => ({
    ...prev,
    [key]: prev[key].map((item, i) => (i === idx ? { ...item, ...patch } : item)),
  }));
}
