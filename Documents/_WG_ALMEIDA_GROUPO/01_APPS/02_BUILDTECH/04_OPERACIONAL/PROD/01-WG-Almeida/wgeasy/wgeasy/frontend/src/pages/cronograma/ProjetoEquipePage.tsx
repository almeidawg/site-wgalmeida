import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  UserPlus,
  Users,
  Search,
  X,
  Loader2,
  ChevronRight,
  Badge,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjetoEquipe } from '@/hooks/useProjetoEquipe';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { normalizeSearchTerm } from '@/utils/searchUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatarData } from '@/lib/utils';

const ProjetoEquipePage = () => {
  const { id: projetoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    membrosEquipe,
    pessoasNaoNaEquipe,
    loading,
    adicionarMembro,
    removerMembro
  } = useProjetoEquipe(projetoId);

  const [searchPessoas, setSearchPessoas] = useState('');
  const [searchEquipe, setSearchEquipe] = useState('');

  // Filtrar pessoas disponíveis
  const pessoasFiltradas = pessoasNaoNaEquipe.filter((pessoa: any) => {
    const searchLower = normalizeSearchTerm(searchPessoas);
    return (
      normalizeSearchTerm(pessoa.nome || '').includes(searchLower) ||
      normalizeSearchTerm(pessoa.funcao || '').includes(searchLower) ||
      (pessoa.cpf || '').includes(searchLower.replace(/\D/g, '')) ||
      (pessoa.rg || '').includes(searchLower.replace(/\D/g, ''))
    );
  });

  // Filtrar membros da equipe
  const equipeFiltrada = membrosEquipe.filter((membro: any) => {
    const searchLower = normalizeSearchTerm(searchEquipe);
    const pessoa = membro.pessoa;
    return (
      normalizeSearchTerm(pessoa?.nome || '').includes(searchLower) ||
      normalizeSearchTerm(pessoa?.funcao || '').includes(searchLower) ||
      normalizeSearchTerm(membro.funcao_no_projeto || '').includes(searchLower)
    );
  });

  // Adicionar pessoa à equipe
  const handleAdicionar = async (pessoaId: string, pessoa: any) => {
    const sucesso = await adicionarMembro(pessoaId);
    if (sucesso) {
      toast({
        title: 'Membro adicionado!',
        description: `${pessoa.nome} foi adicionado à equipe.`
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'NÍo foi possível adicionar o membro.'
      });
    }
  };

  // Remover pessoa da equipe
  const handleRemover = async (membroId: string, pessoa: any) => {
    const sucesso = await removerMembro(membroId);
    if (sucesso) {
      toast({
        title: 'Membro removido',
        description: `${pessoa.nome} foi removido da equipe.`
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'NÍo foi possível remover o membro.'
      });
    }
  };

  // Obter iniciais do nome
  const getInitials = (nome: string) => {
    if (!nome) return '??';
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Formatar CPF
  const formatCPF = (cpf: string) => {
    if (!cpf) return 'NÍo informado';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1800px] mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/cronograma/projects/${projetoId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-normal bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                GestÍo de Equipe
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Adicione colaboradores e fornecedores à equipe do projeto
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* COLUNA ESQUERDA - Pessoas Disponíveis */}
            <Card className="shadow-xl border-2 border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Pessoas Disponíveis
                  </CardTitle>
                  <span className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full">
                    {pessoasFiltradas.length} pessoas
                  </span>
                </div>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome, funçÍo, CPF ou RG..."
                    value={searchPessoas}
                    onChange={(e) => setSearchPessoas(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {pessoasFiltradas.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      {searchPessoas ? 'Nenhuma pessoa encontrada' : 'Todas as pessoas já estÍo na equipe'}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {pessoasFiltradas.map((pessoa: any, index: number) => (
                        <motion.div
                          key={pessoa.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="p-4 hover:bg-blue-50 transition-colors cursor-pointer group"
                          onClick={() => handleAdicionar(pessoa.id, pessoa)}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-14 w-14 border-2 border-blue-200">
                              <AvatarImage src={pessoa.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                                {getInitials(pessoa.nome)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-normal text-lg text-slate-800 truncate">
                                  {pessoa.nome}
                                </h3>
                                <Button
                                  size="sm"
                                  className="text-lg bg-primary hover:bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdicionar(pessoa.id, pessoa);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Adicionar
                                </Button>
                              </div>

                              <div className="mt-2 space-y-1 text-sm text-slate-600">
                                {pessoa.tipo && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="text-xs capitalize">
                                      {pessoa.tipo}
                                    </Badge>
                                    {pessoa.funcao && (
                                      <span className="text-slate-500">• {pessoa.funcao}</span>
                                    )}
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                  {pessoa.cpf && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="font-medium">CPF:</span>
                                      <span>{formatCPF(pessoa.cpf)}</span>
                                    </div>
                                  )}
                                  {pessoa.rg && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="font-medium">RG:</span>
                                      <span>{pessoa.rg}</span>
                                    </div>
                                  )}
                                </div>

                                {(pessoa.telefone || pessoa.email) && (
                                  <div className="flex flex-wrap gap-3 mt-2">
                                    {pessoa.telefone && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <Phone className="h-3 w-3" />
                                        <span>{pessoa.telefone}</span>
                                      </div>
                                    )}
                                    {pessoa.email && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate max-w-[200px]">{pessoa.email}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* COLUNA DIREITA - Equipe do Projeto */}
            <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                    <Users className="h-6 w-6 text-green-600" />
                    Equipe do Projeto
                  </CardTitle>
                  <span className="text-sm text-green-700 bg-white px-3 py-1 rounded-full font-medium">
                    {equipeFiltrada.length} membros
                  </span>
                </div>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Buscar na equipe..."
                    value={searchEquipe}
                    onChange={(e) => setSearchEquipe(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {equipeFiltrada.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      {searchEquipe ? 'Nenhum membro encontrado' : 'Nenhum membro na equipe ainda'}
                      {!searchEquipe && (
                        <p className="text-sm mt-2">Clique nas pessoas da esquerda para adicionar</p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {equipeFiltrada.map((membro: any, index: number) => {
                        const pessoa = membro.pessoa;
                        return (
                          <motion.div
                            key={membro.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="p-4 hover:bg-green-50 transition-colors group"
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="h-14 w-14 border-2 border-green-300">
                                <AvatarImage src={pessoa?.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                                  {getInitials(pessoa?.nome || 'N/A')}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-normal text-lg text-slate-800 truncate">
                                    {pessoa?.nome || 'Nome nÍo disponível'}
                                  </h3>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="text-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemover(membro.id, pessoa)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Remover
                                  </Button>
                                </div>

                                <div className="mt-2 space-y-1 text-sm text-slate-600">
                                  {pessoa?.tipo && (
                                    <div className="flex items-center gap-2">
                                      <Badge className="text-xs capitalize bg-green-100 text-green-700">
                                        {pessoa.tipo}
                                      </Badge>
                                      {pessoa.funcao && (
                                        <span className="text-slate-500">• {pessoa.funcao}</span>
                                      )}
                                    </div>
                                  )}

                                  {membro.funcao_no_projeto && (
                                    <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                                      <strong>FunçÍo no projeto:</strong> {membro.funcao_no_projeto}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                    {pessoa?.cpf && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <span className="font-medium">CPF:</span>
                                        <span>{formatCPF(pessoa.cpf)}</span>
                                      </div>
                                    )}
                                    {pessoa?.rg && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <span className="font-medium">RG:</span>
                                        <span>{pessoa.rg}</span>
                                      </div>
                                    )}
                                  </div>

                                  {membro.data_entrada && (
                                    <div className="text-xs text-slate-500 mt-2">
                                      Adicionado em: {formatarData(membro.data_entrada)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjetoEquipePage;

