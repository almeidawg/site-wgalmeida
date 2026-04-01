import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NovoClientePage() {
  return (
    <div className="wg-page">
      <div className="mb-6">
        <h1 className="wg-page-title">Novo Cliente</h1>
        <p className="wg-page-subtitle">
          Preencha os dados do cliente para criar um novo cadastro no WG Easy.
        </p>
      </div>

      <Card className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[20px] font-normal text-[var(--wg-preto)]">
              Dados básicos
            </h2>
            <p className="text-sm text-[var(--wg-text-muted)]">
              Informações essenciais para identificaçÍo e contato.
            </p>
          </div>
        </div>

        <div className="wg-divider" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" placeholder="Nome completo" />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@exemplo.com" />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" placeholder="(00) 00000-0000" />
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" placeholder="000.000.000-00" />
          </div>
        </div>

        <div className="wg-divider" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" placeholder="00000-000" />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="logradouro">Endereço</Label>
            <Input id="logradouro" placeholder="Rua, avenida, etc." />
          </div>
        </div>

        <div className="wg-divider" />

        <div className="flex justify-end gap-3">
          <Button variant="ghost">Cancelar</Button>
          <Button variant="primary">Salvar cliente</Button>
        </div>
      </Card>
    </div>
  );
}

