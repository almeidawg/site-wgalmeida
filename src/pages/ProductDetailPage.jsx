import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProduct, getProductQuantities } from '@/api/EcommerceApi';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Loader2, ArrowLeft, CheckCircle, Minus, Plus, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRTJFMzhB䊂Lz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjY2FjZWNlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Sem Imagem</textPgo8L3N2Zz4K";

function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = useCallback(async () => {
    if (product && selectedVariant) {
      const availableQuantity = selectedVariant.inventory_quantity;
      try {
        await addToCart(product, selectedVariant, quantity, availableQuantity);
        toast({
          title: t('storePage.productDetail.addedTitle'),
          description: t('storePage.productDetail.addedDescription', { quantity, title: product.title, variant: selectedVariant.title }),
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: t('storePage.productDetail.errorTitle'),
          description: error.message,
        });
      }
    }
  }, [product, selectedVariant, quantity, addToCart, toast]);

  const handleQuantityChange = useCallback((amount) => {
    setQuantity(prevQuantity => {
        const newQuantity = prevQuantity + amount;
        if (newQuantity < 1) return 1;
        return newQuantity;
    });
  }, []);

  const handlePrevImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1);
    }
  }, [product?.images?.length]);

  const handleNextImage = useCallback(() => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1);
    }
  }, [product?.images?.length]);

  const handleVariantSelect = useCallback((variant) => {
    setSelectedVariant(variant);

    if (variant.image_url && product?.images?.length > 0) {
      const imageIndex = product.images.findIndex(image => image.url === variant.image_url);

      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
      }
    }
  }, [product?.images]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProduct = await getProduct(id);

        try {
          const quantitiesResponse = await getProductQuantities({
            fields: 'inventory_quantity',
            product_ids: [fetchedProduct.id]
          });

          const variantQuantityMap = new Map();
          quantitiesResponse.variants.forEach(variant => {
            variantQuantityMap.set(variant.id, variant.inventory_quantity);
          });

          const productWithQuantities = {
            ...fetchedProduct,
            variants: fetchedProduct.variants.map(variant => ({
              ...variant,
              inventory_quantity: variantQuantityMap.get(variant.id) ?? variant.inventory_quantity
            }))
          };

          setProduct(productWithQuantities);

          if (productWithQuantities.variants && productWithQuantities.variants.length > 0) {
            setSelectedVariant(productWithQuantities.variants[0]);
          }
        } catch (quantityError) {
          throw quantityError;
        }
      } catch (err) {
        setError(err.message || t('storePage.productDetail.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-16 w-16 text-wg-orange animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-custom py-12">
        <Link to="/store" className="inline-flex items-center gap-2 text-wg-black hover:text-wg-orange transition-colors mb-6">
          <ArrowLeft size={16} />
          {t('storePage.productDetail.backToStore')}
        </Link>
        <div className="text-center text-red-500 p-8 bg-red-50 border border-red-200 rounded-2xl">
          <XCircle className="mx-auto h-16 w-16 mb-4" />
          <p className="mb-6">{t('storePage.productDetail.loadError', { error })}</p>
        </div>
      </div>
    );
  }

  const price = selectedVariant?.sale_price_formatted ?? selectedVariant?.price_formatted;
  const originalPrice = selectedVariant?.sale_price_in_cents ? selectedVariant?.price_formatted : null;
  const availableStock = selectedVariant ? selectedVariant.inventory_quantity : 0;
  const isStockManaged = selectedVariant?.manage_inventory ?? false;
  const canAddToCart = !isStockManaged || quantity <= availableStock;

  const currentImage = product.images[currentImageIndex];
  const hasMultipleImages = product.images.length > 1;

  return (
    <>
      <Helmet>
        <title>{product.title} - {t('seo.store.title')} WG Almeida</title>
        <meta name="description" content={product.description?.substring(0, 160) || product.title} />
      </Helmet>
      <div className="container-custom section-padding">
        <Link to="/store" className="inline-flex items-center gap-2 text-wg-black hover:text-wg-orange transition-colors mb-6 font-poppins">
          <ArrowLeft size={16} />
          {t('storePage.productDetail.backToStore')}
        </Link>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 bg-white p-8 rounded-2xl shadow-lg">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative">
            <div className="relative overflow-hidden rounded-lg shadow-lg h-96 md:h-[500px]">
              <img
                src={!currentImage?.url ? placeholderImage : currentImage.url}
                alt={product.title}
                className="w-full h-full object-cover"
              />

              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
                    aria-label={t('storePage.productDetail.prevImage')}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
                    aria-label={t('storePage.productDetail.nextImage')}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {product.ribbon_text && (
                <div className="absolute top-4 left-4 bg-wg-orange text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                  {product.ribbon_text}
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="flex justify-center gap-2 mt-4">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-wg-orange' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={t('storePage.productDetail.goToImage', { index: index + 1 })}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col">
            <h1 className="text-4xl font-oswald text-wg-black mb-2">{product.title}</h1>
            <p className="text-lg text-wg-gray mb-4 font-poppins">{product.subtitle}</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-wg-orange">{price}</span>
              {originalPrice && (
                <span className="text-2xl text-gray-400 line-through">{originalPrice}</span>
              )}
            </div>

            <div className="prose text-wg-gray mb-6" dangerouslySetInnerHTML={{ __html: product.description }} />

            {product.variants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-poppins font-semibold text-wg-black mb-2">{t('storePage.productDetail.options')}</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(variant => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                      onClick={() => handleVariantSelect(variant)}
                      className={`transition-all ${selectedVariant?.id === variant.id ? 'bg-wg-orange border-wg-orange text-white' : 'border-gray-300 text-wg-black hover:bg-gray-100'}`}
                    >
                      {variant.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-md p-1">
                <Button onClick={() => handleQuantityChange(-1)} variant="ghost" size="icon" className="rounded-md h-8 w-8 text-wg-gray hover:bg-gray-100"><Minus size={16} /></Button>
                <span className="w-10 text-center text-wg-black font-bold">{quantity}</span>
                <Button onClick={() => handleQuantityChange(1)} variant="ghost" size="icon" className="rounded-md h-8 w-8 text-wg-gray hover:bg-gray-100"><Plus size={16} /></Button>
              </div>
            </div>

            <div className="mt-auto">
              <Button onClick={handleAddToCart} size="lg" className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canAddToCart || !product.purchasable}>
                <ShoppingCart className="mr-2 h-5 w-5" /> {t('storePage.productDetail.addToCart')}
              </Button>

              {isStockManaged && canAddToCart && product.purchasable && (
                <p className="text-sm text-green-600 mt-3 flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> {t('storePage.productDetail.inStock', { count: availableStock })}
                </p>
              )}

              {isStockManaged && !canAddToCart && product.purchasable && (
                 <p className="text-sm text-wg-brown mt-3 flex items-center justify-center gap-2">
                  <XCircle size={16} /> {t('storePage.productDetail.lowStock', { count: availableStock })}
                </p>
              )}

              {!product.purchasable && (
                  <p className="text-sm text-red-500 mt-3 flex items-center justify-center gap-2">
                    <XCircle size={16} /> {t('storePage.productDetail.unavailable')}
                  </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
