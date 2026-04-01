import { useState, useEffect, useCallback } from 'react';
import { supabaseRaw } from '@/lib/supabaseClient';

export const useCatalog = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseRaw
      .from('catalog_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching catalog items:', error);
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
    const channel = supabaseRaw.channel('catalog_items_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog_items' }, fetchItems)
      .subscribe();

    return () => {
      supabaseRaw.removeChannel(channel);
    };
  }, [fetchItems]);

  const addItem = async (itemData: any) => {
    const { error } = await supabaseRaw.from('catalog_items').insert([itemData]);
    if (error) {
      console.error('Error adding item:', error);
      return false;
    }
    return true;
  };

  const updateItem = async (id: string, updates: any) => {
    const { error } = await supabaseRaw
      .from('catalog_items')
      .update(updates)
      .eq('id', id);
    if (error) {
      console.error('Error updating item:', error);
      return false;
    }
    return true;
  };

  const deleteItem = async (id: string) => {
    // First, check if item is used in any project_items
    const { data: projectItems, error: checkError } = await supabaseRaw
        .from('project_items')
        .select('id')
        .eq('catalog_item_id', id)
        .limit(1);

    if (checkError) {
        console.error('Error checking for item usage:', checkError);
        return false;
    }

    if (projectItems && projectItems.length > 0) {
        console.error('Cannot delete item, it is in use by a project.');
        return { success: false, message: 'Este item não pode ser excluído pois está em uso em um ou mais projetos.' };
    }

    const { error } = await supabaseRaw.from('catalog_items').delete().eq('id', id);
    if (error) {
      console.error('Error deleting item:', error);
      return { success: false, message: 'Ocorreu um erro ao excluir o item.' };
    }
    return { success: true };
  };

  const bulkAddItems = async (itemsData: any[]) => {
    const { error } = await supabaseRaw.from('catalog_items').insert(itemsData);
    if (error) {
      console.error('Error bulk adding items:', error);
      return false;
    }
    return true;
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    bulkAddItems
  };
};


