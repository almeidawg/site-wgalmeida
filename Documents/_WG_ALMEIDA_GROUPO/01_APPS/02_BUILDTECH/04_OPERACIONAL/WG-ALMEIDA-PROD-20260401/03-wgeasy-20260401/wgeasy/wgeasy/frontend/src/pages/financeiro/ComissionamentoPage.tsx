/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/financeiro/ComissionamentoPage.tsx
// Página de gestÍo de comissionamento - Tabela de percentuais por categoria e faixa VGV

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Percent,
  Users,
  Edit2,
  Save,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Crown,
  UserPlus,
  Building2,
  Calculator,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  listarTabelaComissoes,
  listarCategoriasComissao,
  listarFaixasVGV,
  atualizarPercentualComissao,
  calcularComissao,
  TabelaComissaoItem,
  CategoriaComissao,
  FaixaVGV,
} from "@/lib/cadastroLinkApi";
import { formatarMoeda } from "@/lib/utils";

// Cores WG
const WG_COLORS = {
  laranja: "#F25C26",
  verde: "#5E9B94",
  azul: "#2B4580",
  marrom: "#8B5E3C",
  preto: "#2E2E2E",
};

// Agrupar dados por categoria
function agruparPorCategoria(dados: TabelaComissaoItem[]): Map<string, TabelaComissaoItem[]> {
  const grupos = new Map<string, TabelaComissaoItem[]>();
  dados.forEach((item) => {
    const key = item.categoria_id;
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key)!.push(item);
  });
  return grupos;
}

// Icone por tipo de pessoa
function getIconByTipo(tipo: string) {
  switch (tipo) {
    case "VENDEDOR":
      return <TrendingUp className="w-4 h-4" />;
    case "ESPECIFICADOR":
      return <Crown className="w-4 h-4" />;
    case "EQUIPE_INTERNA":
      return <Building2 className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
}

// Cor por tipo de pessoa
function getCorByTipo(tipo: string) {
  switch (tipo) {
    case "VENDEDOR":
      return WG_COLORS.azul;
    case "ESPECIFICADOR":
      return WG_COLORS.laranja;
    case "EQUIPE_INTERNA":
      return WG_COLORS.verde;
    default:
      return WG_COLORS.preto;
  }
}

export default function ComissionamentoPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tabela");
  const [loading, setLoading] = useState(true);

  // Dados
  const [tabelaComissoes, setTabelaComissoes] = useState<TabelaComissaoItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaComissao[]>([]);
  const [faixas, setFaixas] = useState<FaixaVGV[]>([]);

  // EdiçÍo
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState<string>("");
  const [salvando, setSalvando] = useState(false);

  // Calculadora
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [calcValor, setCalcValor] = useState("");
  const [calcCategoria, setCalcCategoria] = useState("");
  const [calcResultado, setCalcResultado] = useState<{
    faixaNome: string;
    percentual: number;
    valorComissao: number;
  } | null>(null);
  const [calculando, setCalculando] = useState(false);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [tabela, cats, fx] = await Promise.all([
        listarTabelaComissoes(),
        listarCategoriasComissao(),
        listarFaixasVGV(),
      ]);
      setTabelaComissoes(tabela);
      setCategorias(cats);
      setFaixas(fx);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Iniciar ediçÍo
  function handleStartEdit(categoriaId: string, faixaId: string, percentualAtual: number) {
    setEditando(`${categoriaId}-${faixaId}`);
    setValorEditando(percentualAtual.toString());
  }

  // Cancelar ediçÍo
  function handleCancelEdit() {
    setEditando(null);
    setValorEditando("");
  }

  // Salvar ediçÍo
  async function handleSaveEdit(categoriaId: string, faixaId: string) {
    const percentual = parseFloat(valorEditando);
    if (isNaN(percentual) || percentual < 0 || percentual > 100) {
      toast({
        title: "Valor inválido",
        description: "O percentual deve estar entre 0 e 100",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      const result = await atualizarPercentualComissao(categoriaId, faixaId, percentual);
      if (result.success) {
        toast({ title: "Percentual atualizado!" });
        setEditando(null);
        carregarDados();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  }

  // Calcular comissÍo
  async function handleCalcular() {
    const valor = parseFloat(calcValor);
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para o VGV",
        variant: "destructive",
      });
      return;
    }

    if (!calcCategoria) {
      toast({
        title: "Selecione uma categoria",
        variant: "destructive",
      });
      return;
    }

    setCalculando(true);
    try {
      const resultado = await calcularComissao(valor, calcCategoria);
      if (resultado) {
        setCalcResultado({
          faixaNome: resultado.faixaNome,
          percentual: resultado.percentual,
          valorComissao: resultado.valorComissao,
        });
      } else {
        toast({
          title: "NÍo foi possível calcular",
          description: "Verifique os dados e tente novamente",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no cálculo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCalculando(false);
    }
  }

  // Agrupar dados para exibiçÍo
  const dadosAgrupados = agruparPorCategoria(tabelaComissoes);

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight flex items-center gap-2">
            <Percent className="w-6 h-6" style={{ color: WG_COLORS.laranja }} />
            Comissionamento
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            Gerencie percentuais de comissÍo por categoria e faixa de VGV
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarDados} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => {
              setCalcResultado(null);
              setCalcValor("");
              setCalcCategoria("");
              setCalcModalOpen(true);
            }}
            style={{ background: WG_COLORS.laranja }}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calcular ComissÍo
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${WG_COLORS.azul}20` }}>
                <TrendingUp className="w-5 h-5" style={{ color: WG_COLORS.azul }} />
              </div>
              <div>
                <p className="text-[18px] font-light">
                  {categorias.filter((c) => c.tipo_pessoa === "VENDEDOR").length}
                </p>
                <p className="text-[12px] text-gray-500">Categorias Vendedor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${WG_COLORS.laranja}20` }}>
                <Crown className="w-5 h-5" style={{ color: WG_COLORS.laranja }} />
              </div>
              <div>
                <p className="text-[18px] font-light">
                  {categorias.filter((c) => c.tipo_pessoa === "ESPECIFICADOR").length}
                </p>
                <p className="text-[12px] text-gray-500">Categorias Especificador</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${WG_COLORS.verde}20` }}>
                <Building2 className="w-5 h-5" style={{ color: WG_COLORS.verde }} />
              </div>
              <div>
                <p className="text-[18px] font-light">
                  {categorias.filter((c) => c.tipo_pessoa === "EQUIPE_INTERNA").length}
                </p>
                <p className="text-[12px] text-gray-500">Equipe Interna</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <DollarSign className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-[18px] font-light">{faixas.length}</p>
                <p className="text-[12px] text-gray-500">Faixas de VGV</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tabela">Tabela de Comissões</TabsTrigger>
          <TabsTrigger value="faixas">Faixas de VGV</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>

        {/* Tabela de Comissões */}
        <TabsContent value="tabela" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(dadosAgrupados.entries()).map(([categoriaId, items]) => {
                const primeiroItem = items[0];
                const cor = getCorByTipo(primeiroItem.tipo_pessoa);

                return (
                  <Card key={categoriaId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ background: `${cor}20` }}
                        >
                          {getIconByTipo(primeiroItem.tipo_pessoa)}
                        </div>
                        <div>
                          <CardTitle className="text-[18px] font-light flex items-center gap-2">
                            {primeiroItem.categoria_nome}
                            {primeiroItem.is_master && (
                              <Badge variant="outline" className="text-xs">
                                Master
                              </Badge>
                            )}
                            {primeiroItem.is_indicacao && (
                              <Badge variant="secondary" className="text-xs">
                                Sobre IndicaçÍo
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {primeiroItem.tipo_pessoa.replace("_", " ")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              {items.map((item) => (
                                <th
                                  key={item.faixa_id}
                                  className="p-3 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide"
                                >
                                  <div>{item.faixa_nome}</div>
                                  <div className="text-[12px] text-gray-400 mt-1">
                                    {item.valor_maximo
                                      ? `${formatarMoeda(item.valor_minimo)} - ${formatarMoeda(item.valor_maximo)}`
                                      : `Acima de ${formatarMoeda(item.valor_minimo)}`}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {items.map((item) => {
                                const editKey = `${item.categoria_id}-${item.faixa_id}`;
                                const isEditing = editando === editKey;

                                return (
                                  <td key={item.faixa_id} className="p-3 text-center">
                                    {isEditing ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Input
                                          type="number"
                                          value={valorEditando}
                                          onChange={(e) => setValorEditando(e.target.value)}
                                          className="w-20 h-8 text-center text-[12px]"
                                          step="0.01"
                                          min="0"
                                          max="100"
                                          autoFocus
                                        />
                                        <span className="text-[12px]">%</span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() => handleSaveEdit(item.categoria_id, item.faixa_id)}
                                          disabled={salvando}
                                        >
                                          <Save className="w-4 h-4 text-green-600" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={handleCancelEdit}
                                        >
                                          <X className="w-4 h-4 text-red-500" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div
                                        className="group flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 rounded p-2"
                                        onClick={() =>
                                          handleStartEdit(
                                            item.categoria_id,
                                            item.faixa_id,
                                            item.percentual || 0
                                          )
                                        }
                                      >
                                        <span
                                          className="text-[18px] font-light"
                                          style={{ color: cor }}
                                        >
                                          {item.percentual?.toFixed(2) || "0.00"}%
                                        </span>
                                        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Faixas de VGV */}
        <TabsContent value="faixas">
          <Card>
            <CardHeader>
              <CardTitle className="text-[18px] font-light">Faixas de VGV (Valor Geral de Vendas)</CardTitle>
              <CardDescription>
                Intervalos de valores que determinam o percentual de comissÍo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Cota</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Valor Mínimo</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Valor Máximo</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">DescriçÍo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faixas.map((faixa) => (
                      <tr key={faixa.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <Badge variant="outline">{faixa.cota}</Badge>
                        </td>
                        <td className="p-3 text-[12px] font-normal">{faixa.nome}</td>
                        <td className="p-3 text-[12px]">
                          {formatarMoeda(faixa.valor_minimo)}
                        </td>
                        <td className="p-3 text-[12px]">
                          {faixa.valor_maximo
                            ? formatarMoeda(faixa.valor_maximo)
                            : "Sem limite"}
                        </td>
                        <td className="p-3 text-[12px] text-gray-500">{faixa.descricao || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle className="text-[18px] font-light">Categorias de ComissÍo</CardTitle>
              <CardDescription>
                Tipos de profissionais e suas classificações para comissionamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Categoria</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Código</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">CEO</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">IndicaçÍo</th>
                      <th className="p-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">DescriçÍo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((cat) => (
                      <tr key={cat.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="p-1.5 rounded"
                              style={{ background: `${getCorByTipo(cat.tipo_pessoa)}20` }}
                            >
                              {getIconByTipo(cat.tipo_pessoa)}
                            </div>
                            <span className="text-[12px] font-normal">{cat.nome}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <code className="text-[12px] bg-gray-100 px-2 py-1 rounded">
                            {cat.codigo}
                          </code>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: getCorByTipo(cat.tipo_pessoa),
                              color: getCorByTipo(cat.tipo_pessoa),
                            }}
                          >
                            {cat.tipo_pessoa.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {cat.is_master ? (
                            <Badge className="bg-amber-100 text-amber-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Master
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {cat.is_indicacao ? (
                            <Badge className="bg-purple-100 text-purple-800">
                              <UserPlus className="w-3 h-3 mr-1" />
                              Sobre IndicaçÍo
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-[12px] text-gray-500">{cat.descricao || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Calculadora */}
      <Dialog open={calcModalOpen} onOpenChange={setCalcModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-light flex items-center gap-2">
              <Calculator className="w-5 h-5" style={{ color: WG_COLORS.laranja }} />
              Calculadora de ComissÍo
            </DialogTitle>
            <DialogDescription>
              Simule o valor da comissÍo com base no VGV e categoria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Valor da Venda (VGV)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-500">R$</span>
                <Input
                  type="number"
                  value={calcValor}
                  onChange={(e) => setCalcValor(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label>Categoria do Profissional</Label>
              <Select value={calcCategoria} onValueChange={setCalcCategoria}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {getIconByTipo(cat.tipo_pessoa)}
                        {cat.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {calcResultado && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-600">Faixa aplicada:</span>
                  <Badge variant="outline">{calcResultado.faixaNome}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-600">Percentual:</span>
                  <span className="font-normal" style={{ color: WG_COLORS.laranja }}>
                    {calcResultado.percentual.toFixed(2)}%
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-normal">Valor da ComissÍo:</span>
                    <span className="text-[18px] font-light" style={{ color: WG_COLORS.verde }}>
                      {formatarMoeda(calcResultado.valorComissao)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCalcModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={handleCalcular}
              disabled={calculando}
              style={{ background: WG_COLORS.laranja }}
            >
              {calculando ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              Calcular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

