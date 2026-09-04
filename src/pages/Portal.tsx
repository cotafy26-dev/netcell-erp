import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export function Portal() {
  const { profile } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bem-vindo, {profile?.name}</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus contratos, boletos, equipamentos e chamados.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['Contratos', 'Veja e baixe seus contratos.'],
          ['Boletos e PIX', 'Pague com PIX ou baixe o boleto.'],
          ['Equipamentos alugados', 'O que está com você e até quando.'],
          ['Abrir chamado', 'Precisa de suporte? Registre aqui.'],
        ].map(([t, d]) => (
          <Card key={t}>
            <CardHeader>
              <CardTitle className="text-base">{t}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{d} (em breve)</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
