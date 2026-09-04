/** Formato padrão de erro da API (alinhado com o ExceptionFilter do NestJS). */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

/** KPIs do dashboard (Módulo 1). */
export interface DashboardSummary {
  revenueMonth: number;
  expensesMonth: number;
  profitMonth: number;
  activeContracts: number;
  expiringContracts: number;
  openServiceOrders: number;
  equipmentRented: number;
  equipmentAvailable: number;
  newCustomers: number;
  overdueBoletos: number;
  openInvoices: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface DashboardCharts {
  revenueByMonth: ChartPoint[];
  servicesSold: ChartPoint[];
  rentalsByMonth: ChartPoint[];
  topCustomers: ChartPoint[];
  topEquipment: ChartPoint[];
}

export const API_PREFIX = '/api/v1';
