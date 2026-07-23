import { useState, useEffect, useMemo, ReactNode } from 'react';
import {
  LayoutDashboard,
  Settings2,
  History,
  Cpu,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Lock,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  Wrench,
  Play,
  Save,
  Code,
  Shield
} from 'lucide-react';
import { cn } from './lib/utils';
import { AIProviderConfig, RequestLog, UsageMetric } from './types';
import AdminPanel from './components/AdminPanel';

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  { id: 'openai', name: 'ChatGPT', model: 'gpt-4o', apiKey: '', priority: 0, enabled: true },
  { id: 'gemini', name: 'Gemini', model: 'gemini-1.5-pro', apiKey: '', priority: 1, enabled: true },
  { id: 'anthropic', name: 'Claude', model: 'claude-3-5-sonnet-20240620', apiKey: '', priority: 2, enabled: true },
  { id: 'cloudflare', name: 'Cloudflare AI', model: '@cf/meta/llama-3-8b-instruct', apiKey: '', accountId: '', priority: 3, enabled: false },
  { id: 'ollama', name: 'Ollama (Local)', model: 'llama3', apiKey: 'http://localhost:11434', priority: 4, enabled: false }
];

const AVAILABLE_MODELS = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  cloudflare: ['@cf/meta/llama-3-8b-instruct', '@cf/meta/llama-2-7b-chat-int8', '@cf/mistral/mistral-7b-instruct-v0.1', '@cf/tiiuae/falcon-7b-instruct'],
  ollama: ['llama3', 'mistral', 'phi3', 'gemma']
};

export default function App() {
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'logs' | 'scenarios'>('dashboard');
  const [providers, setProviders] = useState<AIProviderConfig[]>(DEFAULT_PROVIDERS);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [editingScenario, setEditingScenario] = useState<any | null>(null);

  // Load data from localStorage and API
  useEffect(() => {
    const savedProviders = localStorage.getItem('vera_providers');
    if (savedProviders) setProviders(JSON.parse(savedProviders));
    
    const savedLogs = localStorage.getItem('vera_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await fetch('/api/scenarios');
      const data = await res.json();
      setScenarios(data);
    } catch (e) {
      console.error("Erro ao buscar cenários:", e);
    }
  };

  const saveScenariosToApi = async (newScenarios: any[]) => {
    try {
      await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScenarios)
      });
      setScenarios(newScenarios);
    } catch (e) {
      console.error("Erro ao salvar cenários:", e);
    }
  };

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('vera_providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem('vera_logs', JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
  }, [logs]);

  const [isSimulating, setIsSimulating] = useState(false);

  const simulateRequest = async () => {
    setIsSimulating(true);
    const startTime = Date.now();

    // Build financial profile in Vera's format
    const profileData = {
      income: { value: 5000, state: 'HAS_VALUE', origin: 'user_input', confidence: 0.95, lastUpdated: new Date().toISOString(), isEstimated: false },
      expenses: { value: 3500, state: 'HAS_VALUE', origin: 'user_input', confidence: 0.95, lastUpdated: new Date().toISOString(), isEstimated: false },
      liquidAssets: { value: 15000, state: 'HAS_VALUE', origin: 'user_input', confidence: 0.9, lastUpdated: new Date().toISOString(), isEstimated: false },
      totalDebt: { value: 8000, state: 'HAS_VALUE', origin: 'user_input', confidence: 0.85, lastUpdated: new Date().toISOString(), isEstimated: false },
      highInterestDebt: { value: 2000, state: 'HAS_VALUE', origin: 'user_input', confidence: 0.85, lastUpdated: new Date().toISOString(), isEstimated: false },
      age: { value: 35, state: 'HAS_VALUE', origin: 'user_input', confidence: 1.0, lastUpdated: new Date().toISOString(), isEstimated: false },
      investorProfile: { value: 'moderate', state: 'HAS_VALUE', origin: 'user_input', confidence: 0.8, lastUpdated: new Date().toISOString(), isEstimated: false },
      goals: []
    };

    try {
      const enabledProviders = providers
        .filter(p => p.enabled)
        .sort((a, b) => a.priority - b.priority);

      const firstProvider = enabledProviders[0];
      const llmProvider = firstProvider ? firstProvider.id.replace('anthropic', 'claude').replace('openai', 'gpt') : undefined;

      const requestBody: any = {
        userId: `test-${Date.now()}`,
        profile: profileData
      };

      if (llmProvider) {
        requestBody.llmProvider = llmProvider;
        if (firstProvider.apiKey) {
          requestBody.userApiKey = firstProvider.apiKey;
        }
      }

      const response = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

      const newLog: RequestLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        provider: data.llmMetadata?.provider || firstProvider?.name || 'Rule-Based',
        model: data.llmMetadata?.model || 'engine',
        latency: data.llmMetadata?.latency || latency,
        status: response.ok ? 'success' : 'error',
        tokens: data.llmMetadata?.tokens || { prompt: 0, completion: 0, total: 0 },
        request: requestBody,
        response: data,
        errorMessage: response.ok ? undefined : (data.details || data.error)
      };

      setLogs(prev => [newLog, ...prev]);
      if (response.ok) {
        setActiveTab('logs');
      }
    } catch (err: any) {
      const newLog: RequestLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        provider: 'System',
        model: 'N/A',
        latency: Date.now() - startTime,
        status: 'error',
        tokens: { prompt: 0, completion: 0, total: 0 },
        request: { profile: profileData },
        response: null,
        errorMessage: err.message
      };
      setLogs(prev => [newLog, ...prev]);
    } finally {
      setIsSimulating(false);
    }
  };

  const stats = useMemo(() => {
    const totalTokens = logs.reduce((acc, log) => acc + log.tokens.total, 0);
    const totalPrompt = logs.reduce((acc, log) => acc + log.tokens.prompt, 0);
    const totalCompletion = logs.reduce((acc, log) => acc + log.tokens.completion, 0);
    const successRate = logs.length > 0 ? (logs.filter(l => l.status === 'success').length / logs.length) * 100 : 100;
    const avgLatency = logs.length > 0 ? logs.reduce((acc, log) => acc + log.latency, 0) / logs.length : 0;
    
    const providerUsage = providers.map(p => {
      const providerLogs = logs.filter(l => l.provider === p.name);
      return {
        name: p.name,
        tokens: providerLogs.reduce((acc, l) => acc + l.tokens.total, 0),
        prompt: providerLogs.reduce((acc, l) => acc + l.tokens.prompt, 0),
        completion: providerLogs.reduce((acc, l) => acc + l.tokens.completion, 0)
      };
    });

    return { totalTokens, totalPrompt, totalCompletion, successRate, avgLatency, providerUsage };
  }, [logs, providers]);

  const moveProvider = (index: number, direction: 'up' | 'down') => {
    const newProviders = [...providers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newProviders.length) return;
    
    [newProviders[index], newProviders[targetIndex]] = [newProviders[targetIndex], newProviders[index]];
    // Update priorities based on new order
    newProviders.forEach((p, i) => p.priority = i);
    setProviders(newProviders);
  };

  if (view === 'admin') {
    return (
      <div className="h-screen">
        <button
          onClick={() => setView('dashboard')}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
        >
          Back to Dashboard
        </button>
        <AdminPanel />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#111827] font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F6821F] rounded-lg flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-lg">Vera Studio</span>
          </div>
          <button
            onClick={() => setView('admin')}
            className="mt-4 w-full px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Shield className="w-3 h-3" />
            Admin Panel
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-4 h-4" />} 
            label="Visão Geral" 
          />
          <NavItem 
            active={activeTab === 'config'} 
            onClick={() => setActiveTab('config')} 
            icon={<Settings2 className="w-4 h-4" />} 
            label="Configuração IA" 
          />
          <NavItem 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
            icon={<History className="w-4 h-4" />} 
            label="Logs de Requisição" 
          />
          <NavItem 
            active={activeTab === 'scenarios'} 
            onClick={() => setActiveTab('scenarios')} 
            icon={<Wrench className="w-4 h-4" />} 
            label="Cenários Fallback" 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Status do Sistema</span>
              <div className="flex items-center gap-1 text-emerald-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Online
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>Versão</span>
                <span className="font-mono">v2.4.0-stable</span>
              </div>
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>Ambiente</span>
                <span className="font-mono">Production</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            {activeTab === 'dashboard' ? 'Dashboard de Uso' : activeTab === 'config' ? 'Gerenciamento de Provedores' : 'Histórico de Auditoria'}
          </h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={simulateRequest}
              disabled={isSimulating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95",
                isSimulating 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              )}
            >
              {isSimulating ? (
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {isSimulating ? 'Simulando...' : 'Simular Requisição'}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-[10px] font-bold text-gray-500">
              <Activity className="w-3 h-3 text-blue-500" /> API_LATENCY: {stats.avgLatency.toFixed(0)}ms
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <AlertCircle className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total de Tokens" 
                  value={stats.totalTokens.toLocaleString()} 
                  trend={`${((stats.totalCompletion / (stats.totalTokens || 1)) * 100).toFixed(0)}% completion`} 
                  trendUp={true}
                  icon={<Cpu className="w-5 h-5 text-blue-500" />} 
                />
                <StatCard 
                  title="Taxa de Sucesso" 
                  value={`${stats.successRate.toFixed(1)}%`} 
                  trend="Stable" 
                  trendUp={true}
                  icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} 
                />
                <StatCard 
                  title="Latência Média" 
                  value={`${stats.avgLatency.toFixed(0)}ms`} 
                  trend="-45ms" 
                  trendUp={true}
                  icon={<Clock className="w-5 h-5 text-amber-500" />} 
                />
                <StatCard 
                  title="Requisições" 
                  value={logs.length.toString()} 
                  trend="Live" 
                  trendUp={true}
                  icon={<div className="relative">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>} 
                />
              </div>

              {/* Usage Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" /> Consumo em Tempo Real por Provedor
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Prompt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Completion</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  {stats.providerUsage.map((p, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-800">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {p.prompt.toLocaleString()} prompt + {p.completion.toLocaleString()} completion
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-gray-900">{p.tokens.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Tokens</div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${p.tokens > 0 ? (p.prompt / p.tokens) * 100 : 0}%` }} 
                        />
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: `${p.tokens > 0 ? (p.completion / p.tokens) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                  {stats.providerUsage.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-xs italic">
                      Nenhum dado de uso disponível.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">Ordem de Prioridade</h3>
                    <p className="text-xs text-gray-500">Arraste ou use as setas para definir a cascata de fallback.</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Adicionar Provedor Customizado
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {providers.sort((a, b) => a.priority - b.priority).map((p, i) => (
                    <div key={p.id} className="p-6 flex items-start gap-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col gap-1 mt-2">
                        <button onClick={() => moveProvider(i, 'up')} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-0" disabled={i === 0}>
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                        <div className="flex justify-center"><GripVertical className="w-4 h-4 text-gray-200" /></div>
                        <button onClick={() => moveProvider(i, 'down')} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-0" disabled={i === providers.length - 1}>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Provedor & Modelo</label>
                          <div className="flex gap-2">
                            <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shrink-0">
                              {p.name}
                            </div>
                            <select 
                              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={p.model}
                              onChange={(e) => {
                                const newProviders = [...providers];
                                newProviders[i].model = e.target.value;
                                setProviders(newProviders);
                              }}
                            >
                              {(AVAILABLE_MODELS[p.id as keyof typeof AVAILABLE_MODELS] || []).map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                              {p.id === 'ollama' ? 'Base URL' : p.id === 'cloudflare' ? 'API Token' : 'Secret Key'}
                            </label>
                            <div className="relative">
                              <input 
                                type={showKeys[p.id] || p.id === 'ollama' ? "text" : "password"}
                                className="w-full pl-3 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder={p.id === 'ollama' ? "http://localhost:11434" : "sk-..."}
                                value={p.apiKey}
                                onChange={(e) => {
                                  const newProviders = [...providers];
                                  newProviders[i].apiKey = e.target.value;
                                  setProviders(newProviders);
                                }}
                              />
                              {(p.id !== 'ollama' && p.id !== 'cloudflare') && (
                                <button 
                                  onClick={() => setShowKeys(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showKeys[p.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {p.id === 'cloudflare' && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Account ID</label>
                              <input 
                                type="text"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="cloudflare-account-id"
                                value={p.accountId || ''}
                                onChange={(e) => {
                                  const newProviders = [...providers];
                                  newProviders[i].accountId = e.target.value;
                                  setProviders(newProviders);
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-end gap-3 pb-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={cn(
                              "w-10 h-5 rounded-full relative transition-colors",
                              p.enabled ? "bg-blue-600" : "bg-gray-200"
                            )} onClick={() => {
                              const newProviders = [...providers];
                              newProviders[i].enabled = !newProviders[i].enabled;
                              setProviders(newProviders);
                            }}>
                              <div className={cn(
                                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                p.enabled ? "left-6" : "left-1"
                              )} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{p.enabled ? 'Ativo' : 'Inativo'}</span>
                          </label>
                          <button className="p-2 text-gray-300 hover:text-red-500 transition-colors ml-auto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Filtrar logs por provedor, modelo ou status..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50">Status</button>
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50">Data</button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Provedor / Modelo</th>
                        <th className="px-6 py-4">Tokens</th>
                        <th className="px-6 py-4">Latência</th>
                        <th className="px-6 py-4">Data/Hora</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs italic">
                            Nenhum registro encontrado. Execute uma análise para gerar logs.
                          </td>
                        </tr>
                      ) : logs.map((log) => (
                        <LogEntry key={log.id} log={log} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'scenarios' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">Cenários de Fallback Interno</h3>
                    <p className="text-xs text-gray-500">Defina lógicas de resposta para quando todos os provedores de IA falharem.</p>
                  </div>
                  <button 
                    onClick={() => setEditingScenario({ id: Math.random().toString(36).substring(7), name: 'Novo Cenário', condition: 'profile.income > 0', response: { analise_geral: { analise: '', acao: '' }, acoes: { analise: '', acao: '', recomendacoes: [] }, fundos: { analise: '', acao: '', recomendacoes: [] }, previdencia: { analise: '', acao: '' }, poupanca: { analise: '', acao: '' } } })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Novo Cenário
                  </button>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {scenarios.map((s, idx) => (
                    <div key={s.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-800">{s.name}</h4>
                            <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-mono">{s.condition}</code>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setEditingScenario(s)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              const newScenarios = scenarios.filter(sc => sc.id !== s.id);
                              saveScenariosToApi(newScenarios);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Análise Geral</div>
                          <p className="text-xs text-gray-600 italic">"{s.response.analise_geral.analise}"</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Ação Recomendada</div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">{s.response.analise_geral.acao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {scenarios.length === 0 && (
                    <div className="p-12 text-center text-gray-400 text-xs italic">
                      Nenhum cenário configurado.
                    </div>
                  )}
                </div>
              </div>

              {editingScenario && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-bold text-gray-800">Editar Cenário: {editingScenario.name}</h3>
                      <button onClick={() => setEditingScenario(null)} className="text-gray-400 hover:text-gray-600">
                        <Plus className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Cenário</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={editingScenario.name}
                            onChange={e => setEditingScenario({ ...editingScenario, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Condição (JavaScript)</label>
                          <div className="relative">
                            <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="text" 
                              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="profile.income > profile.expenses"
                              value={editingScenario.condition}
                              onChange={e => setEditingScenario({ ...editingScenario, condition: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Resposta Pré-definida (JSON)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500">Análise Geral</label>
                              <textarea 
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 h-24"
                                value={editingScenario.response.analise_geral.analise}
                                onChange={e => {
                                  const res = { ...editingScenario.response };
                                  res.analise_geral.analise = e.target.value;
                                  setEditingScenario({ ...editingScenario, response: res });
                                }}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500">Ação Principal (CTA)</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={editingScenario.response.analise_geral.acao}
                                onChange={e => {
                                  const res = { ...editingScenario.response };
                                  res.analise_geral.acao = e.target.value;
                                  setEditingScenario({ ...editingScenario, response: res });
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Dica de Manutenção</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                              Utilize as variáveis <code className="text-blue-600 font-bold">profile</code> e <code className="text-blue-600 font-bold">portfolio</code> na condição. 
                              Exemplo: <code className="bg-white px-1 rounded border border-gray-200">profile.age {'>'} 60</code>.
                              <br /><br />
                              A resposta deve seguir o modelo Vera para manter a compatibilidade com o frontend do cliente.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                      <button 
                        onClick={() => setEditingScenario(null)}
                        className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          const exists = scenarios.find(s => s.id === editingScenario.id);
                          const newScenarios = exists 
                            ? scenarios.map(s => s.id === editingScenario.id ? editingScenario : s)
                            : [...scenarios, editingScenario];
                          saveScenariosToApi(newScenarios);
                          setEditingScenario(null);
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Salvar Cenário
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
        active 
          ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, value, trend, trendUp, icon }: { title: string, value: string, trend: string, trendUp: boolean, icon: ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
          trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function LogEntry({ log }: { log: RequestLog, key?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className={cn(
        "hover:bg-gray-50/50 transition-colors cursor-pointer group",
        expanded && "bg-gray-50/80"
      )} onClick={() => setExpanded(!expanded)}>
        <td className="px-6 py-4">
          <div className={cn(
            "flex items-center gap-2 text-[10px] font-bold px-2 py-1 rounded-full w-fit",
            log.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {log.status.toUpperCase()}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800">{log.provider}</span>
            <span className="text-[10px] text-gray-400 font-mono">{log.model}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-xs font-mono text-gray-600">{log.tokens.total.toLocaleString()}</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-xs font-mono text-gray-600">{log.latency}ms</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-[10px] text-gray-500 font-mono">
            {new Date(log.timestamp).toLocaleString('pt-BR')}
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <ChevronRight className={cn(
            "w-4 h-4 text-gray-300 transition-transform",
            expanded && "rotate-90"
          )} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 py-6 bg-gray-50/50 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ArrowUpRight className="w-3 h-3" /> Request Payload
                  </h5>
                  <button className="text-[10px] text-blue-600 font-bold hover:underline">Copiar JSON</button>
                </div>
                <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 shadow-inner max-h-64 overflow-y-auto">
                  <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(log.request, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ArrowDownRight className="w-3 h-3" /> Response Data
                  </h5>
                  <button className="text-[10px] text-blue-600 font-bold hover:underline">Copiar JSON</button>
                </div>
                <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 shadow-inner max-h-64 overflow-y-auto">
                  <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(log.response, null, 2)}
                  </pre>
                </div>
              </div>
              {log.errorMessage && (
                <div className="md:col-span-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-mono">
                  <div className="font-bold uppercase mb-1">Error Description:</div>
                  {log.errorMessage}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
