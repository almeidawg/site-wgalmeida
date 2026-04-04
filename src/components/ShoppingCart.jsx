import React, { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { ShoppingCart as ShoppingCartIcon, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
// EcommerceApi loaded on demand to keep @supabase out of the critical path
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const ShoppingCart = ({ isCartOpen, setIsCartOpen }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const location = useLocation();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      toast({
        title: t('storePage.cart.emptyTitle'),
        description: t('storePage.cart.emptyDescription'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const items = cartItems.map(item => ({
        variant_id: item.variant.id,
        quantity: item.quantity,
      }));

      const successUrl = `${window.location.origin}/success`;
      const cancelUrl = window.location.href;

      const { initializeCheckout } = await import('@/api/EcommerceApi');
      const { url } = await initializeCheckout({ items, successUrl, cancelUrl });

      clearCart();
      window.location.href = url;
    } catch (error) {
      toast({
        title: t('storePage.cart.checkoutErrorTitle'),
        description: t('storePage.cart.checkoutErrorDescription'),
        variant: 'destructive',
      });
    }
  }, [cartItems, clearCart, toast]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[100]"
          onClick={() => setIsCartOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-oswald text-wg-black">{t('storePage.cart.title')}</h2>
              <Button onClick={() => setIsCartOpen(false)} variant="ghost" size="icon" className="text-wg-gray hover:bg-wg-gray-light">
                <X />
              </Button>
            </div>
            <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-wg-gray-light">
              {cartItems.length === 0 ? (
                <div className="text-center text-wg-gray h-full flex flex-col items-center justify-center">
                  <ShoppingCartIcon size={48} className="mb-4" />
                  <p>{t('storePage.cart.empty')}</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.variant.id} className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm">
                    <img src={item.product.image} alt={item.product.title} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-grow">
                      <h3 className="font-poppins font-semibold text-wg-black">{item.product.title}</h3>
                      <p className="text-sm text-wg-gray">{item.variant.title}</p>
                      <p className="text-sm text-wg-orange font-bold">
                        {item.variant.sale_price_formatted || item.variant.price_formatted}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <Button onClick={() => updateQuantity(item.variant.id, Math.max(1, item.quantity - 1))} size="sm" variant="ghost" className="px-2 text-wg-gray hover:bg-gray-100">-</Button>
                        <span className="px-2 text-wg-black">{item.quantity}</span>
                        <Button onClick={() => updateQuantity(item.variant.id, item.quantity + 1)} size="sm" variant="ghost" className="px-2 text-wg-gray hover:bg-gray-100">+</Button>
                      </div>
                      <Button onClick={() => removeFromCart(item.variant.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-600 text-xs">
                        {t('storePage.cart.remove')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between items-center mb-4 text-wg-black">
                  <span className="text-lg font-poppins">{t('storePage.cart.total')}</span>
                  <span className="text-2xl font-oswald">{getCartTotal()}</span>
                </div>
                <Button onClick={handleCheckout} className="w-full btn-primary py-3 text-base">
                  {t('storePage.cart.checkout')}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShoppingCart;
