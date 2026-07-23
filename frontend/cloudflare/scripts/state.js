const STORAGE_KEYS = Object.freeze({
  ghostMode: 'esquilo:ghost-mode',
  selectedCategory: 'esquilo:selected-category',
  filters: 'esquilo:dashboard-filters',
  expandedBlocks: 'esquilo:expanded-blocks'
});

const DEFAULT_FILTERS = Object.freeze({
  category: 'all',
  tableSearch: '',
  recommendation: 'all',
  status: 'all',
  sortBy: 'priority',
  sortDirection: 'desc'
});

const DEFAULT_UI = Object.freeze({
  activePage: 'dashboard',
  isBootstrapped: false,
  isLoading: false,
  isRefreshing: false,
  isActionsRefreshing: false,
  isAiLoading: false,
  isGhostMode: false,
  selectedCategory: 'all',
  selectedAssetId: '',
  lastError: '',
  lastWarning: '',
  toast: null,
  modal: {
    isOpen: false,
    name: '',
    payload: null
  },
  expandedBlocks: {
    actions: true,
    funds: false,
    pension: false,
    alerts: true,
    actionPlan: true,
    ai: true
  },
  filters: {
    ...DEFAULT_FILTERS
  }
});

const DEFAULT_DATA = Object.freeze({
  dashboard: null,
  actionsSnapshot: null,
  aiAnalysis: '',
  health: null,
  meta: {
    dataSource: '',
    sourceWarning: '',
    updatedAt: '',
    releaseName: '',
    versionNumber: ''
  }
});

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeClone(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function safeReadStorage(key, fallbackValue) {
  try {
    if (!globalThis.localStorage) {
      return safeClone(fallbackValue);
    }

    const raw = globalThis.localStorage.getItem(key);
    if (!raw) {
      return safeClone(fallbackValue);
    }

    return JSON.parse(raw);
  } catch (error) {
    return safeClone(fallbackValue);
  }
}

function safeWriteStorage(key, value) {
  try {
    if (!globalThis.localStorage) {
      return;
    }

    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* noop */
  }
}

function parseNumeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitized = value
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');

    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickFirstDefined() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return '';
}

function mergeDeep(baseValue, patchValue) {
  if (!isPlainObject(baseValue) || !isPlainObject(patchValue)) {
    return patchValue;
  }

  const next = { ...baseValue };

  Object.entries(patchValue).forEach(function(entry) {
    const key = entry[0];
    const value = entry[1];

    if (isPlainObject(value) && isPlainObject(baseValue[key])) {
      next[key] = mergeDeep(baseValue[key], value);
      return;
    }

    next[key] = value;
  });

  return next;
}

function createInitialUiState() {
  const filters = {
    ...DEFAULT_FILTERS,
    ...(safeReadStorage(STORAGE_KEYS.filters, DEFAULT_FILTERS) || {})
  };

  const expandedBlocks = {
    ...DEFAULT_UI.expandedBlocks,
    ...(safeReadStorage(STORAGE_KEYS.expandedBlocks, DEFAULT_UI.expandedBlocks) || {})
  };

  const storedCategory = normalizeString(
    safeReadStorage(STORAGE_KEYS.selectedCategory, DEFAULT_UI.selectedCategory)
  ) || 'all';

  const selectedCategory = normalizeString(filters.category) && filters.category !== 'all'
    ? filters.category
    : storedCategory;

  const isGhostMode = Boolean(
    safeReadStorage(STORAGE_KEYS.ghostMode, DEFAULT_UI.isGhostMode)
  );

  return {
    ...safeClone(DEFAULT_UI),
    filters,
    expandedBlocks,
    selectedCategory,
    isGhostMode
  };
}

function createInitialState() {
  return {
    ui: createInitialUiState(),
    data: safeClone(DEFAULT_DATA)
  };
}

function persistUiState(state) {
  safeWriteStorage(STORAGE_KEYS.ghostMode, Boolean(state.ui.isGhostMode));
  safeWriteStorage(STORAGE_KEYS.selectedCategory, state.ui.selectedCategory || 'all');
  safeWriteStorage(STORAGE_KEYS.filters, state.ui.filters || DEFAULT_FILTERS);
  safeWriteStorage(STORAGE_KEYS.expandedBlocks, state.ui.expandedBlocks || DEFAULT_UI.expandedBlocks);
}

function deriveMetaFromDashboard(dashboard, currentMeta) {
  const source = isPlainObject(dashboard) ? dashboard : {};

  return {
    ...currentMeta,
    dataSource: normalizeString(pickFirstDefined(source.dataSource, currentMeta.dataSource)),
    sourceWarning: normalizeString(pickFirstDefined(source.sourceWarning, currentMeta.sourceWarning)),
    updatedAt: normalizeString(pickFirstDefined(source.updatedAt, currentMeta.updatedAt))
  };
}

function deriveStateWithDashboard(currentState, payload) {
  return {
    ...currentState,
    data: {
      ...currentState.data,
      dashboard: payload,
      meta: deriveMetaFromDashboard(payload, currentState.data.meta)
    }
  };
}

function deriveStateWithHealth(currentState, payload) {
  const source = isPlainObject(payload) ? payload : {};

  return {
    ...currentState,
    data: {
      ...currentState.data,
      health: payload,
      meta: {
        ...currentState.data.meta,
        releaseName: normalizeString(pickFirstDefined(source.releaseName, currentState.data.meta.releaseName)),
        versionNumber: normalizeString(pickFirstDefined(source.versionNumber, currentState.data.meta.versionNumber)),
        updatedAt: normalizeString(pickFirstDefined(source.updatedAt, currentState.data.meta.updatedAt))
      }
    }
  };
}

function deriveActionsSnapshotFromDashboardPayload(dashboardPayload) {
  const dashboard = isPlainObject(dashboardPayload) ? dashboardPayload : {};
  const orders = pickFirstDefined(dashboard.orders, dashboard.preOrders);
  const categories = pickFirstDefined(dashboard.categories, dashboard.categorySnapshots);

  return {
    actions: toArray(pickFirstDefined(dashboard.actions, dashboard.acoes)),
    orders: isPlainObject(orders) ? orders : {},
    assetRanking: isPlainObject(dashboard.assetRanking) ? dashboard.assetRanking : {},
    categories: isPlainObject(categories) ? categories : {},
    summary: isPlainObject(dashboard.summary) ? dashboard.summary : {},
    dataSource: normalizeString(dashboard.dataSource),
    sourceWarning: normalizeString(dashboard.sourceWarning),
    updatedAt: normalizeString(dashboard.updatedAt)
  };
}

function deriveStateWithActionsSnapshot(currentState, snapshotPayload) {
  const snapshot = isPlainObject(snapshotPayload) ? snapshotPayload : {};
  const currentDashboard = isPlainObject(currentState.data.dashboard)
    ? safeClone(currentState.data.dashboard)
    : {};

  if (Array.isArray(snapshot.actions)) {
    currentDashboard.actions = snapshot.actions;
  }

  if (isPlainObject(snapshot.orders)) {
    currentDashboard.orders = snapshot.orders;
  }

  if (isPlainObject(snapshot.assetRanking)) {
    currentDashboard.assetRanking = snapshot.assetRanking;
  }

  if (isPlainObject(snapshot.categories)) {
    currentDashboard.categories = {
      ...(isPlainObject(currentDashboard.categories) ? currentDashboard.categories : {}),
      ...snapshot.categories
    };
  }

  if (isPlainObject(snapshot.summary)) {
    currentDashboard.summary = {
      ...(isPlainObject(currentDashboard.summary) ? currentDashboard.summary : {}),
      ...snapshot.summary
    };
  }

  if (normalizeString(snapshot.dataSource)) {
    currentDashboard.dataSource = snapshot.dataSource;
  }

  if (normalizeString(snapshot.sourceWarning)) {
    currentDashboard.sourceWarning = snapshot.sourceWarning;
  }

  if (normalizeString(snapshot.updatedAt)) {
    currentDashboard.updatedAt = snapshot.updatedAt;
  }

  return {
    ...currentState,
    data: {
      ...currentState.data,
      actionsSnapshot: snapshot,
      dashboard: currentDashboard,
      meta: deriveMetaFromDashboard(currentDashboard, currentState.data.meta)
    }
  };
}

function filterActions(actions, filters) {
  const list = toArray(actions);
  const search = normalizeString(filters.tableSearch).toLowerCase();
  const recommendation = normalizeString(filters.recommendation).toLowerCase();
  const status = normalizeString(filters.status).toLowerCase();

  return list.filter(function(item) {
    const ticker = normalizeString(
      pickFirstDefined(item && item.ticker, item && item.codigo, item && item.code, item && item.nome, item && item.name)
    ).toLowerCase();

    const institution = normalizeString(
      pickFirstDefined(item && item.instituicao, item && item.platform, item && item.corretora, item && item.broker)
    ).toLowerCase();

    const itemRecommendation = normalizeString(
      pickFirstDefined(item && item.recommendation, item && item.recomendacao, item && item.recommendationContext)
    ).toLowerCase();

    const itemStatus = normalizeString(
      pickFirstDefined(item && item.status, item && item.assetStatus, item && item.statusLabel, item && item.signal)
    ).toLowerCase();

    if (search && !ticker.includes(search) && !institution.includes(search)) {
      return false;
    }

    if (recommendation && recommendation !== 'all' && !itemRecommendation.includes(recommendation)) {
      return false;
    }

    if (status && status !== 'all' && !itemStatus.includes(status)) {
      return false;
    }

    return true;
  });
}

function sortActions(actions, filters) {
  const list = toArray(actions).slice();
  const sortBy = normalizeString(filters.sortBy) || 'priority';
  const direction = normalizeString(filters.sortDirection) === 'asc' ? 1 : -1;

  list.sort(function(left, right) {
    if (sortBy === 'name') {
      const leftName = String(pickFirstDefined(left && left.ticker, left && left.codigo, left && left.nome, left && left.name) || '');
      const rightName = String(pickFirstDefined(right && right.ticker, right && right.codigo, right && right.nome, right && right.name) || '');
      return direction * leftName.localeCompare(rightName, 'pt-BR');
    }

    const leftValue = sortBy === 'performance'
      ? parseNumeric(pickFirstDefined(left && left.returnPct, left && left.rentabilidadePct, left && left.performancePct))
      : sortBy === 'value'
        ? parseNumeric(pickFirstDefined(left && left.currentValue, left && left.valorAtual, left && left.totalAtual))
        : parseNumeric(pickFirstDefined(left && left.priorityScore, left && left.score));

    const rightValue = sortBy === 'performance'
      ? parseNumeric(pickFirstDefined(right && right.returnPct, right && right.rentabilidadePct, right && right.performancePct))
      : sortBy === 'value'
        ? parseNumeric(pickFirstDefined(right && right.currentValue, right && right.valorAtual, right && right.totalAtual))
        : parseNumeric(pickFirstDefined(right && right.priorityScore, right && right.score));

    return direction * (leftValue - rightValue);
  });

  return list;
}

function createDashboardStore() {
  let state = createInitialState();
  const listeners = new Set();

  function getState() {
    return state;
  }

  function notify(meta) {
    const payload = {
      state: safeClone(state),
      meta: {
        at: new Date().toISOString(),
        ...(meta || {})
      }
    };

    listeners.forEach(function(listener) {
      listener(payload);
    });
  }

  function commit(nextState, meta) {
    state = nextState;
    persistUiState(state);
    notify(meta);
    return safeClone(state);
  }

  function patch(partialState, meta) {
    const nextState = mergeDeep(state, partialState);
    return commit(nextState, {
      type: 'patch',
      ...(meta || {})
    });
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener invalido para o store do dashboard.');
    }

    listeners.add(listener);

    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function reset(meta) {
    return commit(createInitialState(), {
      type: 'reset',
      ...(meta || {})
    });
  }

  function bootstrap(meta) {
    return patch(
      {
        ui: {
          isBootstrapped: true
        }
      },
      {
        type: 'bootstrap',
        ...(meta || {})
      }
    );
  }

  function setDashboardData(payload, meta) {
    return commit(deriveStateWithDashboard(state, payload), {
      type: 'dashboard:set',
      ...(meta || {})
    });
  }

  function setActionsSnapshot(payload, meta) {
    return commit(deriveStateWithActionsSnapshot(state, payload), {
      type: 'actions-snapshot:set',
      ...(meta || {})
    });
  }

  function setHealth(payload, meta) {
    return commit(deriveStateWithHealth(state, payload), {
      type: 'health:set',
      ...(meta || {})
    });
  }

  function setAiAnalysis(text, meta) {
    return patch(
      {
        data: {
          aiAnalysis: normalizeString(text)
        }
      },
      {
        type: 'ai:set',
        ...(meta || {})
      }
    );
  }

  function setLoadingStatus(key, value, meta) {
    if (!Object.prototype.hasOwnProperty.call(state.ui, key)) {
      throw new Error('Chave de loading invalida: ' + key);
    }

    return patch(
      {
        ui: {
          [key]: Boolean(value)
        }
      },
      {
        type: 'loading:set',
        key,
        ...(meta || {})
      }
    );
  }

  function setError(message, meta) {
    return patch(
      {
        ui: {
          lastError: normalizeString(message)
        }
      },
      {
        type: 'error:set',
        ...(meta || {})
      }
    );
  }

  function clearError(meta) {
    return patch(
      {
        ui: {
          lastError: ''
        }
      },
      {
        type: 'error:clear',
        ...(meta || {})
      }
    );
  }

  function setWarning(message, meta) {
    return patch(
      {
        ui: {
          lastWarning: normalizeString(message)
        }
      },
      {
        type: 'warning:set',
        ...(meta || {})
      }
    );
  }

  function clearWarning(meta) {
    return patch(
      {
        ui: {
          lastWarning: ''
        }
      },
      {
        type: 'warning:clear',
        ...(meta || {})
      }
    );
  }

  function setToast(toast, meta) {
    const normalizedToast = toast && isPlainObject(toast)
      ? {
          id: normalizeString(toast.id) || 'toast-' + Date.now(),
          tone: normalizeString(toast.tone) || 'info',
          title: normalizeString(toast.title),
          message: normalizeString(toast.message),
          timeoutMs: Number(toast.timeoutMs) > 0 ? Number(toast.timeoutMs) : 4000
        }
      : null;

    return patch(
      {
        ui: {
          toast: normalizedToast
        }
      },
      {
        type: 'toast:set',
        ...(meta || {})
      }
    );
  }

  function openModal(name, payload, meta) {
    return patch(
      {
        ui: {
          modal: {
            isOpen: true,
            name: normalizeString(name),
            payload: payload === undefined ? null : payload
          }
        }
      },
      {
        type: 'modal:open',
        ...(meta || {})
      }
    );
  }

  function closeModal(meta) {
    return patch(
      {
        ui: {
          modal: {
            isOpen: false,
            name: '',
            payload: null
          }
        }
      },
      {
        type: 'modal:close',
        ...(meta || {})
      }
    );
  }

  function toggleGhostMode(forceValue, meta) {
    const nextValue = typeof forceValue === 'boolean' ? forceValue : !state.ui.isGhostMode;

    return patch(
      {
        ui: {
          isGhostMode: nextValue
        }
      },
      {
        type: 'ghost-mode:toggle',
        ...(meta || {})
      }
    );
  }

  function setSelectedCategory(category, meta) {
    const nextCategory = normalizeString(category) || 'all';

    return patch(
      {
        ui: {
          selectedCategory: nextCategory,
          filters: {
            ...state.ui.filters,
            category: nextCategory
          }
        }
      },
      {
        type: 'category:set',
        ...(meta || {})
      }
    );
  }

  function setSelectedAsset(assetId, meta) {
    return patch(
      {
        ui: {
          selectedAssetId: normalizeString(assetId)
        }
      },
      {
        type: 'asset:set',
        ...(meta || {})
      }
    );
  }

  function toggleExpandedBlock(blockName, forceValue, meta) {
    const key = normalizeString(blockName);
    if (!key) {
      throw new Error('Bloco nao informado para toggleExpandedBlock.');
    }

    const nextValue = typeof forceValue === 'boolean'
      ? forceValue
      : !Boolean(state.ui.expandedBlocks[key]);

    return patch(
      {
        ui: {
          expandedBlocks: {
            ...state.ui.expandedBlocks,
            [key]: nextValue
          }
        }
      },
      {
        type: 'block:toggle',
        blockName: key,
        ...(meta || {})
      }
    );
  }

  function setFilters(nextFilters, meta) {
    if (!isPlainObject(nextFilters)) {
      throw new Error('Filtros invalidos para o dashboard.');
    }

    const mergedFilters = {
      ...state.ui.filters,
      ...nextFilters
    };

    if (!normalizeString(mergedFilters.category)) {
      mergedFilters.category = 'all';
    }

    if (!normalizeString(mergedFilters.sortBy)) {
      mergedFilters.sortBy = DEFAULT_FILTERS.sortBy;
    }

    if (!normalizeString(mergedFilters.sortDirection)) {
      mergedFilters.sortDirection = DEFAULT_FILTERS.sortDirection;
    }

    return patch(
      {
        ui: {
          filters: mergedFilters,
          selectedCategory: mergedFilters.category || 'all'
        }
      },
      {
        type: 'filters:set',
        ...(meta || {})
      }
    );
  }

  function resetFilters(meta) {
    return patch(
      {
        ui: {
          filters: {
            ...DEFAULT_FILTERS
          },
          selectedCategory: 'all'
        }
      },
      {
        type: 'filters:reset',
        ...(meta || {})
      }
    );
  }

  return {
    getState,
    subscribe,
    patch,
    reset,
    bootstrap,
    setDashboardData,
    setActionsSnapshot,
    setHealth,
    setAiAnalysis,
    setLoadingStatus,
    setError,
    clearError,
    setWarning,
    clearWarning,
    setToast,
    openModal,
    closeModal,
    toggleGhostMode,
    setSelectedCategory,
    setSelectedAsset,
    toggleExpandedBlock,
    setFilters,
    resetFilters
  };
}

function createSelectors(store) {
  return {
    getState: function() {
      return safeClone(store.getState());
    },

    getDashboard: function() {
      return store.getState().data.dashboard;
    },

    getHealth: function() {
      return store.getState().data.health;
    },

    getAiAnalysis: function() {
      return normalizeString(store.getState().data.aiAnalysis);
    },

    getMeta: function() {
      return safeClone(store.getState().data.meta);
    },

    getUi: function() {
      return safeClone(store.getState().ui);
    },

    isAnyLoading: function() {
      const ui = store.getState().ui;
      return Boolean(ui.isLoading || ui.isRefreshing || ui.isActionsRefreshing || ui.isAiLoading);
    },

    getSelectedCategory: function() {
      return normalizeString(store.getState().ui.selectedCategory) || 'all';
    },

    getActions: function() {
      const dashboard = store.getState().data.dashboard;
      return toArray(pickFirstDefined(dashboard && dashboard.actions, dashboard && dashboard.acoes));
    },

    getFilteredActions: function() {
      const dashboard = store.getState().data.dashboard;
      const actions = toArray(pickFirstDefined(dashboard && dashboard.actions, dashboard && dashboard.acoes));
      const filters = store.getState().ui.filters;
      return sortActions(filterActions(actions, filters), filters);
    },

    getCategoryItems: function(categoryKey) {
      const dashboard = store.getState().data.dashboard;
      const normalizedCategory = normalizeString(categoryKey || store.getState().ui.selectedCategory) || 'all';

      const actions = toArray(pickFirstDefined(dashboard && dashboard.actions, dashboard && dashboard.acoes));
      const funds = toArray(pickFirstDefined(dashboard && dashboard.funds, dashboard && dashboard.fundos));
      const pension = toArray(pickFirstDefined(dashboard && dashboard.pension, dashboard && dashboard.previdencia));

      if (normalizedCategory === 'actions') return actions;
      if (normalizedCategory === 'funds') return funds;
      if (normalizedCategory === 'pension') return pension;

      return {
        actions,
        funds,
        pension
      };
    },

    getSummaryMetric: function(key) {
      const dashboard = store.getState().data.dashboard;
      if (!isPlainObject(dashboard && dashboard.summary)) {
        return null;
      }

      return dashboard.summary[key] !== undefined ? dashboard.summary[key] : null;
    },

    getActionPlan: function() {
      const dashboard = store.getState().data.dashboard;
      return isPlainObject(dashboard && dashboard.actionPlan)
        ? dashboard.actionPlan
        : isPlainObject(dashboard && dashboard.planoDeAcao)
          ? dashboard.planoDeAcao
          : null;
    },

    getAlerts: function() {
      const dashboard = store.getState().data.dashboard;
      return toArray(pickFirstDefined(dashboard && dashboard.alerts, dashboard && dashboard.alertas));
    },

    getScore: function() {
      const dashboard = store.getState().data.dashboard;
      return pickFirstDefined(
        dashboard && dashboard.score,
        dashboard && dashboard.portfolioScore,
        dashboard && dashboard.summary && dashboard.summary.score,
        dashboard && dashboard.metrics && dashboard.metrics.score,
        null
      );
    }
  };
}

const dashboardStore = createDashboardStore();
const dashboardSelectors = createSelectors(dashboardStore);

export {
  DEFAULT_DATA,
  DEFAULT_FILTERS,
  DEFAULT_UI,
  STORAGE_KEYS,
  createDashboardStore,
  dashboardSelectors,
  dashboardStore,
  deriveActionsSnapshotFromDashboardPayload,
  filterActions,
  sortActions
};