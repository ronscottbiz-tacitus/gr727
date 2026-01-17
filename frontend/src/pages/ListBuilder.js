import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getList, addItem, removeItem, getStore } from '../api';
import { Button, Input, Card, CardContent } from '../components/ui';
import { Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import RetailerShell from '../components/RetailerShell';
import { themes } from '../utils/themes';

const ListBuilder = () => {
  const { listId, retailerId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [store, setStore] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Use Theme or Default
  const theme = retailerId ? themes[retailerId] : { color: 'bg-blue-600', hover: 'hover:bg-blue-700' };

  useEffect(() => {
    const loadData = async () => {
      try {
        const listRes = await getList(listId);
        setList(listRes.data);
        
        const storeRes = await getStore(listRes.data.store_id);
        setStore(storeRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [listId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    setAdding(true);
    try {
      const res = await addItem(listId, newItem);
      setList(res.data);
      setNewItem('');
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await removeItem(listId, itemId);
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getPlaceholder = () => {
      if (!store) return "e.g. Milk, Bread...";
      const type = store.store_type || 'grocery';
      if (type === 'hardware') return "e.g. Hammer, Paint, Plywood...";
      if (type === 'department') return "e.g. Shirt, Shampoo, Lego...";
      return "e.g. Milk, Bread, Apples...";
  };

  const handleStart = () => {
      const path = retailerId 
        ? `/demo/${retailerId}/list/${listId}/navigate`
        : `/list/${listId}/navigate`;
      navigate(path);
  };

  const content = (
    <div className="space-y-6 p-4 pb-48 relative min-h-screen">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Shopping List</h2>
        <p className="text-slate-500 text-sm">
            Preparing your trip for <span className="font-semibold text-slate-700">{store?.name}</span>
        </p>
      </div>

      <form onSubmit={handleAddItem} className="flex space-x-2">
        <Input 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={adding} className={`${theme.color} ${theme.hover} text-white`}>
          <Plus className="h-5 w-5" />
        </Button>
      </form>

      <div className="space-y-3">
        {list?.items.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Your list is empty</p>
          </div>
        )}

        {list?.items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-slate-500">
                  {item.aisle_name ? (
                    <span className={`font-medium opacity-80`} style={{ color: theme.accent || '#2563eb' }}>{item.aisle_name}</span>
                  ) : (
                    <span className="text-orange-500 italic">Unmapped</span>
                  )}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemoveItem(item.id)}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {list?.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 max-w-md mx-auto z-10 pb-20 pt-4 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-area-bottom">
          <Button 
            className={`w-full h-14 text-lg shadow-xl ${theme.color} ${theme.hover} text-white rounded-xl`}
            onClick={handleStart}
          >
            Start Shopping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading list...</div>;

  // Wrap in Shell if Retailer Mode
  if (retailerId) {
      return <RetailerShell retailerId={retailerId}>{content}</RetailerShell>;
  }

  return content;
};

export default ListBuilder;
