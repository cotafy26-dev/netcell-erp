import type { Resource } from './roles';

/** Navegação do ERP — usada pela sidebar do admin e pelo mapa de rotas. */
export interface ModuleDef {
  key: string;
  label: string;
  path: string;
  icon: string; // nome do ícone lucide-react
  resource: Resource;
  group: 'Operação' | 'Comercial' | 'Financeiro' | 'Atendimento' | 'Gestão';
}

export const ERP_MODULES: ModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard', resource: 'dashboard', group: 'Gestão' },

  { key: 'crm', label: 'CRM / Funil', path: '/admin/crm', icon: 'Filter', resource: 'crm', group: 'Comercial' },
  { key: 'customers', label: 'Clientes', path: '/admin/clientes', icon: 'Users', resource: 'customers', group: 'Comercial' },
  { key: 'contracts', label: 'Contratos', path: '/admin/contratos', icon: 'FileSignature', resource: 'contracts', group: 'Comercial' },

  { key: 'equipment', label: 'Equipamentos', path: '/admin/equipamentos', icon: 'HardDrive', resource: 'equipment', group: 'Operação' },
  { key: 'inventory', label: 'Estoque', path: '/admin/estoque', icon: 'Boxes', resource: 'inventory', group: 'Operação' },
  { key: 'rentals', label: 'Locação', path: '/admin/locacao', icon: 'CalendarClock', resource: 'rentals', group: 'Operação' },
  { key: 'service_orders', label: 'Ordens de Serviço', path: '/admin/os', icon: 'Wrench', resource: 'service_orders', group: 'Operação' },

  { key: 'finance', label: 'Financeiro', path: '/admin/financeiro', icon: 'Wallet', resource: 'finance', group: 'Financeiro' },
  { key: 'fiscal', label: 'Notas Fiscais', path: '/admin/fiscal', icon: 'ReceiptText', resource: 'fiscal', group: 'Financeiro' },

  { key: 'tickets', label: 'Chamados', path: '/admin/chamados', icon: 'LifeBuoy', resource: 'tickets', group: 'Atendimento' },
  { key: 'calendar', label: 'Agenda', path: '/admin/agenda', icon: 'CalendarDays', resource: 'calendar', group: 'Atendimento' },

  { key: 'reports', label: 'Relatórios', path: '/admin/relatorios', icon: 'BarChart3', resource: 'reports', group: 'Gestão' },
  { key: 'users', label: 'Usuários', path: '/admin/usuarios', icon: 'ShieldCheck', resource: 'users', group: 'Gestão' },
  { key: 'integrations', label: 'Integrações', path: '/admin/integracoes', icon: 'Plug', resource: 'integrations', group: 'Gestão' },
  { key: 'settings', label: 'Configurações', path: '/admin/configuracoes', icon: 'Settings', resource: 'settings', group: 'Gestão' },
];

/** Tags aceitas no editor de modelos de contrato. */
export const CONTRACT_TAGS = [
  '{{cliente}}', '{{cpf}}', '{{cnpj}}', '{{equipamento}}', '{{valor}}',
  '{{data}}', '{{vencimento}}', '{{cidade}}', '{{responsavel}}',
  '{{cnpj_empresa}}', '{{numero_contrato}}', '{{periodo}}',
] as const;
