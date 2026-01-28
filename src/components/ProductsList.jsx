import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { getProducts, getProductQuantities } from '@/api/EcommerceApi';
import { useTranslation } from 'react-i18next';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRTJFMzhA⊂Lz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjY2FjZWNlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Sem Imagem</textPgo8L3N2Zz4K";

// Cores das unidades para hover aleatório
const unitColors = ['wg-orange', 'wg-green', 'wg-blue', 'wg-brown'];

const ProductCard = ({ product, index }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cor aleatória baseada no índice do produto
  const cardColor = unitColors[index % unitColors.length];

  const displayVariant = useMemo(() => product.variants[0], [product]);
  const hasSale = useMemo(() => displayVariant && displayVariant.sale_price_in_cents !== null, [displayVariant]);
  const displayPrice = useMemo(() => hasSale ? displayVariant.sale_price_formatted : displayVariant.price_formatted, [displayVariant, hasSale]);
  const originalPrice = useMemo(() => hasSale ? displayVariant.price_formatted : null, [displayVariant, hasSale]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.variants.length > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    const defaultVariant = product.variants[0];

    try {
      await addToCart(product, defaultVariant, 1, defaultVariant.inventory_quantity);
      toast({
        title: t('storePage.cart.addedTitle'),
        description: t('storePage.cart.addedDescription', { title: product.title }),
      });
    } catch (error) {
      toast({
        title: t('storePage.cart.errorTitle'),
        description: error.message,
      });
    }
  }, [product, addToCart, toast, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/product/${product.id}`}>
        <div className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 bg-white border border-gray-100">
          {/* Borda colorida no topo - aparece no hover */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-${cardColor} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 z-10`} />

          {/* Imagem */}
          <div className="relative h-64 overflow-hidden">
            <img
              src={product.image || placeholderImage}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Overlay gradiente no hover */}
            <div className={`absolute inset-0 bg-gradient-to-t from-${cardColor}/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Ribbon */}
            {product.ribbon_text && (
              <motion.div
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="absolute top-4 left-4 bg-wg-orange text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg"
              >
                {product.ribbon_text}
              </motion.div>
            )}

            {/* Badge de categoria */}
            <div className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
              <Package className={`w-5 h-5 text-${cardColor}`} />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-5 relative">
            {/* Elemento decorativo */}
            <div className={`absolute -top-8 right-4 w-16 h-16 bg-${cardColor}/5 rounded-full group-hover:scale-150 transition-transform duration-700`} />

            <h3 className="text-lg font-inter font-semibold text-wg-black truncate mb-1 relative z-10">
              {product.title}
            </h3>
            <p className="text-sm text-wg-gray h-10 overflow-hidden mb-3 relative z-10">
              {product.subtitle || t('storePage.productFallback.subtitle')}
            </p>

            {/* Preço */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className={`font-bold text-${cardColor} text-xl`}>{displayPrice}</span>
              {hasSale && (
                <span className="line-through text-wg-gray text-sm">{originalPrice}</span>
              )}
            </div>

            {/* Botão */}
            <Button
              onClick={handleAddToCart}
              className={`w-full bg-${cardColor} hover:bg-${cardColor}/90 text-white transition-all duration-300 group-hover:shadow-lg`}
            >
              <ShoppingCart className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              {t('storePage.productFallback.add')}
            </Button>
          </div>

          {/* Borda inferior colorida - aparece no hover */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${cardColor} transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100`} />
        </div>
      </Link>
    </motion.div>
  );
};

const ProductsList = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductsWithQuantities = async () => {
      try {
        setLoading(true);
        setError(null);

        const productsResponse = await getProducts();

        if (productsResponse.products.length === 0) {
          setProducts([]);
          return;
        }

        const productIds = productsResponse.products.map(product => product.id);

        const quantitiesResponse = await getProductQuantities({
          fields: 'inventory_quantity',
          product_ids: productIds
        });

        const variantQuantityMap = new Map();
        quantitiesResponse.variants.forEach(variant => {
          variantQuantityMap.set(variant.id, variant.inventory_quantity);
        });

        const productsWithQuantities = productsResponse.products.map(product => ({
          ...product,
          variants: product.variants.map(variant => ({
            ...variant,
            inventory_quantity: variantQuantityMap.get(variant.id) ?? variant.inventory_quantity
          }))
        }));

        setProducts(productsWithQuantities);
      } catch (err) {
        setError(err.message || t('storePage.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchProductsWithQuantities();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-12 w-12 text-wg-orange animate-spin" />
        <p className="text-wg-gray">{t('storePage.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8 bg-red-50 rounded-2xl">
        <p>{t('storePage.errors.loadError', { error })}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-wg-gray p-12 bg-white rounded-2xl shadow-sm">
        <Package className="w-16 h-16 mx-auto mb-4 text-wg-gray/50" />
        <p className="text-lg">{t('storePage.empty.title')}</p>
        <p className="text-sm mt-2">{t('storePage.empty.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};

export default ProductsList;
