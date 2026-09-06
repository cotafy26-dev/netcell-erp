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

/**
 * Só entram aqui os módulos com tela funcional de verdade — a lista é o menu
 * do sistema, e item sem página por trás vira link morto. Os demais (CRM,
 * Locação, Notas Fiscais, Relatórios, Integrações, Configurações) voltam
 * conforme forem construídos.
 */
export const ERP_MODULES: ModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard', resource: 'dashboard', group: 'Gestão' },
  { key: 'users', label: 'Usuários', path: '/admin/usuarios', icon: 'UserCog', resource: 'users', group: 'Gestão' },
  { key: 'site', label: 'Página de Vendas', path: '/admin/site', icon: 'Megaphone', resource: 'settings', group: 'Gestão' },

  { key: 'customers', label: 'Clientes', path: '/admin/clientes', icon: 'Users', resource: 'customers', group: 'Comercial' },
  { key: 'proposals', label: 'Proposta Comercial', path: '/admin/propostas', icon: 'FileText', resource: 'contracts', group: 'Comercial' },
  { key: 'contracts', label: 'Contratos', path: '/admin/contratos', icon: 'FileSignature', resource: 'contracts', group: 'Comercial' },

  { key: 'equipment', label: 'Equipamentos', path: '/admin/equipamentos', icon: 'HardDrive', resource: 'equipment', group: 'Operação' },
  { key: 'inventory', label: 'Estoque', path: '/admin/estoque', icon: 'Boxes', resource: 'inventory', group: 'Operação' },
  { key: 'service_orders', label: 'Ordens de Serviço', path: '/admin/os', icon: 'Wrench', resource: 'service_orders', group: 'Operação' },

  { key: 'finance', label: 'Financeiro', path: '/admin/financeiro', icon: 'CircleDollarSign', resource: 'finance', group: 'Financeiro' },
];

/** Tags aceitas nos modelos de contrato/proposta — {{tag}} vira input no formulário. */
export const CONTRACT_TAGS = [
  '{{cliente_nome}}', '{{cliente_documento}}', '{{cliente_telefone}}',
  '{{endereco_evento}}', '{{equipamentos}}', '{{data_inicio}}',
  '{{valor_diaria}}', '{{valor_instalacao}}', '{{valor_total}}',
  '{{cidade}}', '{{data_assinatura}}', '{{numero}}',
] as const;
