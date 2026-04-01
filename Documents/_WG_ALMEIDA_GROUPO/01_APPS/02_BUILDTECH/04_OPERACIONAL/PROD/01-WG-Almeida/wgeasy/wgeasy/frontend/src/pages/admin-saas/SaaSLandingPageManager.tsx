import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, Trash2, PlusCircle } from "lucide-react";

// DefiniçÍo de tipo para a configuraçÍo da landing page
interface LandingPageConfig {
  hero_title?: string;
  hero_subtitle?: string;
  features_section?: {
    title?: string;
    subtitle?: string;
    features?: { t: string; d: string }[];
  };
}

export default function SaaSLandingPageManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [config, setConfig] = useState<LandingPageConfig>({});

  // 1. Fetch all SaaS products for the selector
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["saas_products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saas_produtos").select("id, nome");
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch the details of the selected product
  const { data: selectedProduct, isLoading: isLoadingSelectedProduct } = useQuery({
    queryKey: ["saas_product_details", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const { data, error } = await supabase
        .from("saas_produtos")
        .select("id, nome, config_landing_page")
        .eq("id", selectedProductId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProductId // Only run query if a product is selected
  });
  
  // 3. Update local form state when a new product is loaded
  useEffect(() => {
    if (selectedProduct) {
      setConfig(selectedProduct.config_landing_page || {});
    } else {
      setConfig({});
    }
  }, [selectedProduct]);

  // 4. Mutation to update the product's config
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: LandingPageConfig) => {
      if (!selectedProductId) throw new Error("Nenhum produto selecionado.");

      const { data, error } = await supabase
        .from("saas_produtos")
        .update({ config_landing_page: newConfig })
        .eq("id", selectedProductId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "ConfiguraçÍo da landing page salva.", variant: 'success' });
      // Refetch data to ensure UI is up-to-date
      queryClient.invalidateQueries({ queryKey: ["saas_product_details", selectedProductId] });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });


  const handleFieldChange = (section: keyof LandingPageConfig, field: string, value: string) => {
    setConfig(prev => ({
        ...prev,
        [section]: {
            ...(prev[section] as Record<string, unknown> || {}),
            [field]: value
        }
    }));
  };
  
  const handleFeatureChange = (index: number, field: 't' | 'd', value: string) => {
      const newFeatures = [...(config.features_section?.features || [])];
      newFeatures[index] = { ...newFeatures[index], [field]: value };
      setConfig(prev => ({
          ...prev,
          features_section: {
              ...prev.features_section,
              features: newFeatures,
          }
      }));
  };

  const addFeature = () => {
      const newFeatures = [...(config.features_section?.features || []), { t: "Novo Título", d: "Nova descriçÍo" }];
      setConfig(prev => ({
          ...prev,
          features_section: {
              ...prev.features_section,
              features: newFeatures
          }
      }));
  };
  
  const removeFeature = (index: number) => {
      const newFeatures = [...(config.features_section?.features || [])];
      newFeatures.splice(index, 1);
      setConfig(prev => ({
          ...prev,
          features_section: {
              ...prev.features_section,
              features: newFeatures
          }
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateConfigMutation.mutate(config);
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciador de Conteúdo - Landing Pages</h1>

      <div className="mb-8 max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Produto</label>
        <Select onValueChange={setSelectedProductId} value={selectedProductId || ""}>
          <SelectTrigger>
            <SelectValue placeholder={isLoadingProducts ? "Carregando produtos..." : "Selecione um produto"} />
          </SelectTrigger>
          <SelectContent>
            {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoadingSelectedProduct && <Loader2 className="animate-spin" />}

      {selectedProductId && !isLoadingSelectedProduct && selectedProduct && (
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Hero Section */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">SeçÍo Hero</h2>
            <div className="space-y-4">
              <div>
                <label className="font-medium">Título Principal (hero_title)</label>
                <Input value={config.hero_title || ""} onChange={e => setConfig(p => ({...p, hero_title: e.target.value}))} />
              </div>
              <div>
                <label className="font-medium">Subtítulo (hero_subtitle)</label>
                <Textarea value={config.hero_subtitle || ""} onChange={e => setConfig(p => ({...p, hero_subtitle: e.target.value}))} />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">SeçÍo de Features</h2>
             <div className="space-y-4">
               <div>
                  <label className="font-medium">Título da SeçÍo (features_section.title)</label>
                  <Input value={config.features_section?.title || ""} onChange={e => handleFieldChange('features_section', 'title', e.target.value)} />
               </div>
               <div>
                  <label className="font-medium">Subtítulo da SeçÍo (features_section.subtitle)</label>
                  <Textarea value={config.features_section?.subtitle || ""} onChange={e => handleFieldChange('features_section', 'subtitle', e.target.value)} />
               </div>

                <h3 className="text-lg font-semibold pt-4">Itens</h3>
                <div className="space-y-4">
                    {(config.features_section?.features || []).map((feature, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border rounded-md">
                            <div className="flex-grow space-y-2">
                                <Input placeholder="Título da feature" value={feature.t} onChange={e => handleFeatureChange(index, 't', e.target.value)} />
                                <Input placeholder="DescriçÍo da feature" value={feature.d} onChange={e => handleFeatureChange(index, 'd', e.target.value)} />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeFeature(index)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" onClick={addFeature} className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/> Adicionar Feature</Button>
             </div>
          </div>
          
          <Button type="submit" disabled={updateConfigMutation.isPending}>
            {updateConfigMutation.isPending ? <Loader2 className="animate-spin mr-2"/> : null}
            Salvar Alterações
          </Button>
        </form>
      )}
    </div>
  );
}

