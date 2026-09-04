import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { AdminLayout, PortalLayout, RequireAuth } from '@/components/layout';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Portal } from '@/pages/Portal';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Clientes, ClienteForm } from '@/pages/admin/Clientes';
import { Equipamentos, EquipamentoForm } from '@/pages/admin/Equipamentos';
import { Estoque, EstoqueItem } from '@/pages/admin/Estoque';
import { OrdensServico, OSForm, OSDetail } from '@/pages/admin/OrdensServico';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
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
              </Route>
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<Portal />} />
              </Route>
            </Route>

            <Route path="*" element={<Home />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
