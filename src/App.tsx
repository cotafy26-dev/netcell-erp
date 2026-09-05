import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { AdminLayout, PortalLayout, RequireAuth } from '@/components/layout';
import { Login } from '@/pages/Login';
import { Portal } from '@/pages/Portal';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Clientes, ClienteForm } from '@/pages/admin/Clientes';
import { Equipamentos, EquipamentoForm } from '@/pages/admin/Equipamentos';
import { Estoque, EstoqueItem } from '@/pages/admin/Estoque';
import { OrdensServico, OSForm, OSDetail } from '@/pages/admin/OrdensServico';
import { Contratos, ContratoForm, ContratoView, ContratoEdit } from '@/pages/admin/Contratos';
import { Propostas, PropostaForm, PropostaView, PropostaEdit } from '@/pages/admin/Propostas';
import { Usuarios, UsuarioForm, UsuarioEdit } from '@/pages/admin/Usuarios';
import { Financeiro, FinanceiroForm, FinanceiroView } from '@/pages/admin/Financeiro';

/**
 * A página de vendas é o index.html estático (raiz do domínio) — não faz
 * parte deste app React. Este shell (app.html) só existe pra /login, /admin
 * e /portal; o .htaccess manda qualquer uma dessas rotas pra cá.
 * "/" aqui é só uma rede de segurança (não deveria ser alcançado na prática).
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAuth staffOnly />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="clientes/:id" element={<ClienteForm />} />
                <Route path="equipamentos" element={<Equipamentos />} />
                <Route path="equipamentos/:id" element={<EquipamentoForm />} />
                <Route path="estoque" element={<Estoque />} />
                <Route path="estoque/:id" element={<EstoqueItem />} />
                <Route path="os" element={<OrdensServico />} />
                <Route path="os/novo" element={<OSForm />} />
                <Route path="os/:id" element={<OSDetail />} />
                <Route path="contratos" element={<Contratos />} />
                <Route path="contratos/novo" element={<ContratoForm />} />
                <Route path="contratos/:id" element={<ContratoView />} />
                <Route path="contratos/:id/editar" element={<ContratoEdit />} />
                <Route path="propostas" element={<Propostas />} />
                <Route path="propostas/novo" element={<PropostaForm />} />
                <Route path="propostas/:id" element={<PropostaView />} />
                <Route path="propostas/:id/editar" element={<PropostaEdit />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="usuarios/novo" element={<UsuarioForm />} />
                <Route path="usuarios/:id" element={<UsuarioEdit />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="financeiro/novo" element={<FinanceiroForm />} />
                <Route path="financeiro/:id" element={<FinanceiroView />} />
              </Route>
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<Portal />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
