import { useState } from 'react';
import {
  Settings2,
  Zap,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Code,
  Database,
  Eye,
  EyeOff,
  Toggle2,
  Copy,
  Save,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LLMProvider {
  id: string;
  name: string;
  model: string;
  enabled: boolean;
  status: 'online' | 'offline' | 'error';
  latency: number;
  tokensToday: number;
  costToday: number;
  lastRequest: string;
}

interface PromptConfig {
  id: string;
  name: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  active: boolean;
}

const PROVIDERS: LLMProvider[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    model: 'claude-opus-4-7',
    enabled: true,
    status: 'online',
    latency: 1250,
    tokensToday: 45230,
    costToday: 0.68,
    lastRequest: '2 min ago',
  },
  {
    id: 'gpt',
    name: 'GPT-4o (OpenAI)',
    model: 'gpt-4o',
    enabled: true,
    status: 'online',
    latency: 892,
    tokensToday: 32150,
    costToday: 0.81,
    lastRequest: '5 min ago',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    model: 'gemini-1.5-pro',
    enabled: false,
    status: 'offline',
    latency: 0,
    tokensToday: 0,
    costToday: 0,
    lastRequest: 'Never',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare AI',
    model: 'llama-3-8b',
    enabled: true,
    status: 'online',
    latency: 650,
    tokensToday: 28900,
    costToday: 0.14,
    lastRequest: '1 min ago',
  },
];

const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: 'unified',
    name: 'Unified Financial Analysis',
    systemPrompt: 'Voce eh o motor de analise financeira Vera. Analise o perfil financeiro do cliente...',
    temperature: 0.7,
    maxTokens: 2000,
    active: true,
  },
  {
    id: 'insights',
    name: 'Esquilo Insights Generation',
    systemPrompt: 'Gere insights detalhados para o dashboard Esquilo...',
    temperature: 0.6,
    maxTokens: 1500,
    active: false,
  },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'prompts' | 'logs'>('overview');
  const [providers, setProviders] = useState(PROVIDERS);
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptConfig | null>(null);

  const toggleProvider = (id: string) => {
    setProviders(providers.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-gray-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/10';
      case 'offline': return 'bg-gray-500/10';
      case 'error': return 'bg-red-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500" />
              <div>
                <h1 className="text-2xl font-bold">Vera Admin</h1>
                <p className="text-sm text-slate-400">Backend Control Panel</p>
              </div>
            </div>
            <button className="rounded-lg bg-slate-800 px-4 py-2 hover:bg-slate-700 transition-colors">
              <RefreshCw className="inline mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'providers', label: 'LLM Providers', icon: Zap },
              { id: 'prompts', label: 'Prompts', icon: Code },
              { id: 'logs', label: 'Logs', icon: Database },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Requests</p>
                    <p className="text-3xl font-bold">12,547</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500/50" />
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Active Providers</p>
                    <p className="text-3xl font-bold">3/4</p>
                  </div>
                  <Zap className="h-8 w-8 text-green-500/50" />
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Avg Latency</p>
                    <p className="text-3xl font-bold">898ms</p>
                  </div>
                  <Settings2 className="h-8 w-8 text-cyan-500/50" />
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Cost Today</p>
                    <p className="text-3xl font-bold">$2.63</p>
                  </div>
                  <Database className="h-8 w-8 text-yellow-500/50" />
                </div>
              </div>
            </div>

            {/* Provider Status Quick View */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="mb-6 text-lg font-semibold">Provider Status</h2>
              <div className="space-y-3">
                {providers.map(provider => (
                  <div key={provider.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-3 w-3 rounded-full',
                        provider.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      )} />
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-xs text-slate-400">{provider.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{provider.latency}ms</p>
                      <p className="text-xs text-slate-400">{provider.tokensToday} tokens</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">LLM Provider Management</h2>
            <div className="grid gap-6">
              {providers.map(provider => (
                <div key={provider.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      <p className="text-sm text-slate-400">{provider.model}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-full p-2', getStatusBg(provider.status))}>
                        {provider.status === 'online' ? (
                          <CheckCircle2 className={cn('h-5 w-5', getStatusColor(provider.status))} />
                        ) : (
                          <AlertCircle className={cn('h-5 w-5', getStatusColor(provider.status))} />
                        )}
                      </div>
                      <button
                        onClick={() => toggleProvider(provider.id)}
                        className={cn(
                          'rounded-lg px-4 py-2 font-medium transition-colors',
                          provider.enabled
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        )}
                      >
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-400">Latency</p>
                      <p className="text-lg font-semibold">{provider.latency}ms</p>
                    </div>
                    <div className="rounded bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-400">Tokens Today</p>
                      <p className="text-lg font-semibold">{provider.tokensToday.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-400">Cost Today</p>
                      <p className="text-lg font-semibold">${provider.costToday.toFixed(2)}</p>
                    </div>
                    <div className="rounded bg-slate-800/50 p-3">
                      <p className="text-xs text-slate-400">Last Request</p>
                      <p className="text-lg font-semibold">{provider.lastRequest}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Prompt Configurations</h2>
              <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Prompt
              </button>
            </div>

            <div className="grid gap-6">
              {prompts.map(prompt => (
                <div key={prompt.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{prompt.name}</h3>
                        {prompt.active && (
                          <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-200">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">System Prompt</label>
                      <textarea
                        readOnly
                        defaultValue={prompt.systemPrompt}
                        className="h-24 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-mono text-slate-300"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">Temperature</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          defaultValue={prompt.temperature}
                          className="w-full"
                        />
                        <p className="text-sm text-slate-400">{prompt.temperature}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Tokens</label>
                        <input
                          type="number"
                          defaultValue={prompt.maxTokens}
                          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Request Logs</h2>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                      <th className="px-4 py-3 text-left font-medium">Provider</th>
                      <th className="px-4 py-3 text-left font-medium">User ID</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Latency</th>
                      <th className="px-4 py-3 text-left font-medium">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="px-4 py-3">{new Date(Date.now() - i * 60000).toISOString()}</td>
                        <td className="px-4 py-3">{['Claude', 'GPT-4', 'Cloudflare'][i % 3]}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">usr_{i + 1000}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                            Success
                          </span>
                        </td>
                        <td className="px-4 py-3">{800 + i * 50}ms</td>
                        <td className="px-4 py-3">{1200 + i * 100}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
