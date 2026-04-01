/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React from 'react';

import { motion } from 'framer-motion';

import { Plus, Search, Edit, Trash2, FileImage as ImageIcon, Upload, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useCatalog } from '@/hooks/useCatalog';
import { normalizeSearchTerm } from '@/utils/searchUtils';

import { useToast } from '@/components/ui/use-toast';



const categories = [

    "Arquitetura", "DocumentaçÍo", "Staff", "Pré Obra e Remoções",

    "Demolições", "Infra Ar", "Elétrica", "AutomaçÍo",

    "Hidrossanitária", "Gás", "Gesso", "Paredes",

    "Pisos", "Pintura", "Içamento", "FinalizaçÍo",

    "ProduçÍo", "Limpeza Pós Obra", "Vidraçaria", "Marmoraria"

];



interface CatalogFormProps {

  item?: any;

  onSubmit: (data: any) => void;

  onFinished: () => void;

}



const CatalogForm: React.FC<CatalogFormProps> = ({ item, onSubmit, onFinished }) => {

    const [formData, setFormData] = React.useState({

        name: item?.name || '',

        category: item?.category || '',

        type: item?.type || 'Produto',

        unit: item?.unit || 'm2',

        productivity: item?.productivity || '',

        setup_days: item?.setup_days || '0',

        value: item?.value || '',

        trade: item?.trade || '',

        image_url: item?.image_url || '',

    });



    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();

        if (!formData.name || !formData.category || !formData.productivity) {

            alert('Nome, Categoria e Produtividade sÍo obrigatórios.');

            return;

        }

        const processedData = {

            ...formData,

            productivity: parseFloat(formData.productivity) || 0,

            setup_days: parseFloat(formData.setup_days) || 0,

            value: parseFloat(formData.value) || 0,

        };

        onSubmit(processedData);

        onFinished();

    };



    return (

        <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">

                <div><Label htmlFor="name">Nome</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Piso Porcelanato 90x90" required /></div>

                <div><Label htmlFor="category">Categoria</Label><Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required><SelectTrigger><SelectValue placeholder="Selecione a categoria"/></SelectTrigger><SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>

            </div>

            <div className="grid grid-cols-2 gap-4">

                <div><Label htmlFor="type">Tipo</Label><Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Produto">Produto</SelectItem><SelectItem value="Serviço">Serviço</SelectItem></SelectContent></Select></div>

                <div><Label htmlFor="unit">Unidade</Label><Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="m2">m²</SelectItem><SelectItem value="un">Unidade</SelectItem><SelectItem value="ml">Metro Linear</SelectItem></SelectContent></Select></div>

            </div>

            <div className="grid grid-cols-3 gap-4">

                <div><Label htmlFor="productivity">Produtividade/dia</Label><Input id="productivity" type="number" step="0.01" value={formData.productivity} onChange={(e) => setFormData({ ...formData, productivity: e.target.value })} placeholder="Ex: 15" required /></div>

                <div><Label htmlFor="setup_days">Setup (dias)</Label><Input id="setup_days" type="number" step="0.1" value={formData.setup_days} onChange={(e) => setFormData({ ...formData, setup_days: e.target.value })} placeholder="Ex: 0.5" /></div>

                <div><Label htmlFor="value">Valor (R$)</Label><Input id="value" type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="Ex: 89.90" /></div>

            </div>

            <div><Label htmlFor="trade">Ofício/Especialidade</Label><Input id="trade" value={formData.trade} onChange={(e) => setFormData({ ...formData, trade: e.target.value })} placeholder="Ex: Pedreiro, Eletricista" /></div>

            <div><Label htmlFor="image_url">URL da Imagem</Label><Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://exemplo.com/imagem.png" /></div>

            <Button type="submit" className="w-full text-lg bg-primary hover:bg-primary/90">{item ? 'Salvar Alterações' : 'Adicionar Item'}</Button>

        </form>

    );

};



const CronogramaCatalogPage = () => {

  const { items, addItem, updateItem, deleteItem, bulkAddItems } = useCatalog();

  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  const [editDialogState, setEditDialogState] = React.useState<{ open: boolean; item: any | null }>({ open: false, item: null });

  const [deleteDialogState, setDeleteDialogState] = React.useState<{ open: boolean; itemId: string | null }>({ open: false, itemId: null });

  const [search, setSearch] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);



  const handleAddItem = async (data: any) => {

    const success = await addItem(data);

    if (success) {

      toast({ title: "Item adicionado! 📦", description: `${data.name} foi adicionado ao catálogo.` });

    } else {

      toast({ variant: 'destructive', title: "Erro ao adicionar item." });

    }

  };



  const handleUpdateItem = async (data: any) => {

    const success = await updateItem(editDialogState.item.id, data);

    if(success) {

      toast({ title: "Item atualizado! ✨", description: `${data.name} foi atualizado.` });

    } else {

      toast({ variant: 'destructive', title: "Erro ao atualizar item." });

    }

  };



  const handleDeleteItem = async () => {

      if (!deleteDialogState.itemId) return;

      const result = await deleteItem(deleteDialogState.itemId);

      if (result && typeof result === "object" && "success" in result && result.success) {

          toast({ description: "Item removido" });

      } else {

          const description =
            result && typeof result === "object" && "message" in result
              ? String(result.message)
              : "Ocorreu um erro ao excluir o item.";
          toast({ variant: "destructive", title: "NÍo foi possível remover", description });

      }

      setDeleteDialogState({open: false, itemId: null});

  }



  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;



    const reader = new FileReader();

    reader.onload = async (e) => {

      const text = e.target?.result as string;

      const lines = text.split(/\r?\n/).slice(1).filter(line => line.trim() !== '');

      const newItems: any[] = [];



      for (const line of lines) {

        const [name, category, type, unit, productivity, setup_days, value, trade, image_url] = line.split(',');

        const parsedProductivity = parseFloat(productivity);



        if (name && category && type && !isNaN(parsedProductivity) && parsedProductivity > 0) {

            newItems.push({ name: name.trim(), category: category.trim(), type: type.trim(), unit: unit.trim() || 'm2', productivity: parsedProductivity, setup_days: parseFloat(setup_days) || 0, value: parseFloat(value) || 0, trade: trade?.trim() || '', image_url: image_url?.trim() || null });

        }

      }



      if (newItems.length > 0) {

        toast({ title: `Importando ${newItems.length} itens...` });

        const success = await bulkAddItems(newItems);

        if (success) { toast({ title: "ImportaçÍo concluída!", description: `${newItems.length} itens foram adicionados.` }); }

        else { toast({ variant: "destructive", title: "Erro na importaçÍo" }); }

      } else { toast({ variant: "destructive", title: "Nenhum item válido encontrado" }); }

    };

    reader.readAsText(file);

    if (event.target) event.target.value = '';

  };



  const searchTerm = normalizeSearchTerm(search);
  const filteredItems = items.filter((item: any) =>
    normalizeSearchTerm(item.name || '').includes(searchTerm) ||
    (item.code && normalizeSearchTerm(item.code).includes(searchTerm)) ||
    (item.category && normalizeSearchTerm(item.category).includes(searchTerm))
  );



  return (

    <>

      <div className="p-8"><div className="max-w-7xl mx-auto space-y-8">

          <div className="flex items-center justify-between gap-4">

            <div><h1 className="text-2xl font-normal bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Catálogo de Itens</h1><p className="text-sm text-slate-600 mt-2">Gerencie itens e produtividades</p></div>

            <div className="flex gap-2">

                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" /><Button variant="outline" className="text-lg" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Importar CSV</Button>

                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}><DialogTrigger asChild><Button className="text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30"><Plus className="h-4 w-4 mr-2" />Novo Item</Button></DialogTrigger><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Adicionar Item ao Catálogo</DialogTitle></DialogHeader><CatalogForm onSubmit={handleAddItem} onFinished={() => setAddDialogOpen(false)} /></DialogContent></Dialog>

            </div>

          </div>

          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input placeholder="Buscar itens..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full">

                <thead className="bg-slate-50 border-b border-slate-200"><tr>

                    <th className="px-6 py-4 text-left text-sm font-normal text-slate-700">Item</th>

                    <th className="px-6 py-4 text-left text-sm font-normal text-slate-700">Código</th><th className="px-6 py-4 text-left text-sm font-normal text-slate-700">Categoria</th>

                    <th className="px-6 py-4 text-left text-sm font-normal text-slate-700">Tipo</th><th className="px-6 py-4 text-left text-sm font-normal text-slate-700">Produtividade</th><th className="px-6 py-4 text-left text-sm font-normal text-slate-700">Ações</th>

                </tr></thead>

                <tbody className="divide-y divide-slate-200">

                  {filteredItems.map((item: any) => (

                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50 transition-colors">

                      <td className="px-6 py-4 text-sm font-medium"><div className="flex items-center gap-4">{item.image_url ? (<img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-md object-cover" />) : (<div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-slate-400" /></div>)}<span>{item.name}</span></div></td>

                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{item.code}</td><td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>

                      <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'Produto' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{item.type}</span></td>

                      <td className="px-6 py-4 text-sm text-slate-600">{item.productivity}/{item.unit}/dia</td>

                      <td className="px-6 py-4 text-sm"><div className="flex gap-2">

                          <Button variant="ghost" size="icon" onClick={() => setEditDialogState({ open: true, item })}><Edit className="h-4 w-4" /></Button>

                          <Button variant="ghost" size="icon" onClick={() => setDeleteDialogState({ open: true, itemId: item.id })}><Trash2 className="h-4 w-4 text-rose-500" /></Button>

                      </div></td>

                    </motion.tr>

                  ))}

                </tbody>

          </table></div></div>

          {filteredItems.length === 0 && (<div className="text-center py-12"><p className="text-slate-600">Nenhum item encontrado</p></div>)}



          <Dialog open={editDialogState.open} onOpenChange={(open) => setEditDialogState({ open, item: open ? editDialogState.item : null })}>

              <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Editar Item do Catálogo</DialogTitle></DialogHeader>{editDialogState.item && <CatalogForm item={editDialogState.item} onSubmit={handleUpdateItem} onFinished={() => setEditDialogState({ open: false, item: null })} />}</DialogContent>

          </Dialog>



          <AlertDialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({ open, itemId: open ? deleteDialogState.itemId : null })}>

            <AlertDialogContent>

                <AlertDialogHeader><AlertDialogTitle>Confirmar ExclusÍo</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir este item? Esta açÍo nÍo pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogCancel onClick={() => setDeleteDialogState({ open: false, itemId: null })}>Cancelar</AlertDialogCancel>

                    <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

          </AlertDialog>

      </div></div>

    </>

  );

};



export default CronogramaCatalogPage;


