import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from '@/lib/motion-lite';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Package,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRTJFMzhA⊂Lz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjY2FjZWNlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Sem Imagem</textPgo8L3N2Zz4K";

// Cores das unidades para hover aleatório
const unitColors = ['wg-orange', 'wg-green', 'wg-blue', 'wg-green', 'wg-blue', 'wg-orange', 'wg-blue', 'wg-brown'];

const unitColorStyles = {
  'wg-orange': {
    line: 'bg-wg-orange',
    overlay: 'from-wg-orange/20',
    icon: 'text-wg-orange',
    accent: 'text-wg-orange',
    button: 'bg-wg-orange hover:bg-wg-orange/90',
    halo: 'bg-wg-orange/5',
  },
  'wg-green': {
    line: 'bg-wg-green',
    overlay: 'from-wg-green/20',
    icon: 'text-wg-green',
    accent: 'text-wg-green',
    button: 'bg-wg-green hover:bg-wg-green/90',
    halo: 'bg-wg-green/5',
  },
  'wg-blue': {
    line: 'bg-wg-blue',
    overlay: 'from-wg-blue/20',
    icon: 'text-wg-blue',
    accent: 'text-wg-blue',
    button: 'bg-wg-blue hover:bg-wg-blue/90',
    halo: 'bg-wg-blue/5',
  },
  'wg-brown': {
    line: 'bg-wg-brown',
    overlay: 'from-wg-brown/20',
    icon: 'text-wg-brown',
    accent: 'text-wg-brown',
    button: 'bg-wg-brown hover:bg-wg-brown/90',
    halo: 'bg-wg-brown/5',
  },
};

const hasProductImage = (product) =>
  Boolean(product?.image && typeof product.image === 'string' && product.image.trim().length > 0);

const getProductInventory = (product) => {
  const managedVariants = (product?.variants || []).filter((variant) => variant.manage_inventory);
  if (!managedVariants.length) return Number.POSITIVE_INFINITY;

  return managedVariants.reduce((highest, variant) => {
    const quantity = Number(variant.inventory_quantity ?? 0);
    return Math.max(highest, quantity);
  }, 0);
};

const isProductAvailable = (product) =>
  product?.purchasable !== false && getProductInventory(product) > 0;

const getProductPriceValue = (product) => {
  const variant = product?.variants?.[0];
  if (!variant) return Number.POSITIVE_INFINITY;
  return variant.sale_price_in_cents ?? variant.price_in_cents ?? Number.POSITIVE_INFINITY;
};

const getPrimaryCollectionId = (product) => product?.collections?.[0]?.collection_id || null;

const getCategoryLabel = (product, categoryMap) => {
  const primaryCollectionId = getPrimaryCollectionId(product);
  if (primaryCollectionId && categoryMap.has(primaryCollectionId)) {
    return categoryMap.get(primaryCollectionId);
  }

  return product?.type?.value || 'Coleção';
};

const ProductCard = ({ product, index, categoryLabel }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cor aleatória baseada no índice do produto
  const cardColor = unitColors[index % unitColors.length];
  const cardStyles = unitColorStyles[cardColor] || unitColorStyles['wg-orange'];

  const displayVariant = useMemo(() => product.variants[0], [product]);
  const hasSale = useMemo(() => displayVariant && displayVariant.sale_price_in_cents !== null, [displayVariant]);
  const displayPrice = useMemo(() => hasSale ? displayVariant.sale_price_formatted : displayVariant.price_formatted, [displayVariant, hasSale]);
  const originalPrice = useMemo(() => hasSale ? displayVariant.price_formatted : null, [displayVariant, hasSale]);
  const available = useMemo(() => isProductAvailable(product), [product]);
  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!available) {
      toast({
        title: t('storePage.cart.errorTitle'),
        description: 'Este item está indisponível no momento.',
      });
      return;
    }

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
  }, [product, addToCart, toast, navigate, available, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link to={`/product/${product.id}`} className="block h-full">
        <div className="group relative flex h-full min-h-[31rem] flex-col overflow-hidden rounded-[26px] border border-black/[0.06] bg-white transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_55px_rgba(17,17,17,0.12)]">
          {/* Borda colorida no topo - aparece no hover */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${cardStyles.line} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 z-10`} />

          {/* Imagem */}
          <div className="relative h-[13.5rem] overflow-hidden">
            <img
              src={product.image || placeholderImage}
              alt={product.title}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Overlay gradiente no hover */}
            <div className={`absolute inset-0 bg-gradient-to-t ${cardStyles.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Ribbon */}
            {product.ribbon_text && (
              <motion.div
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="absolute top-4 left-4 rounded-full bg-[rgba(24,24,24,0.62)] px-3 py-1 text-[11px] font-light text-white/90 shadow-md backdrop-blur-md"
              >
                {product.ribbon_text}
              </motion.div>
            )}

            {/* Badge de categoria */}
            <div className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
              <Package className={`w-5 h-5 ${cardStyles.icon}`} />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="relative flex flex-1 flex-col p-5">
            {/* Elemento decorativo */}
            <div className={`absolute -top-8 right-4 w-16 h-16 ${cardStyles.halo} rounded-full group-hover:scale-150 transition-transform duration-700`} />

            <div className="relative z-10 mb-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
              <span className="rounded-full bg-black/[0.035] px-3 py-1 text-[rgba(46,46,46,0.52)]">
                {categoryLabel}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                available ? 'bg-[#F3F8F4] text-[#4E7D66]' : 'bg-[#FBF1F1] text-[#A06A68]'
              }`}>
                {available ? <CheckCircle2 className="h-[11px] w-[11px]" /> : null}
                {available ? 'Disponível' : 'Sem estoque'}
              </span>
            </div>

            <h3 className="relative z-10 min-h-[6rem] text-[1.02rem] font-inter font-light leading-[1.42] text-wg-black line-clamp-4">
              {product.title}
            </h3>

            {/* Preço */}
            <div className="mb-5 mt-auto flex items-baseline gap-2 pt-4">
              <span className={`text-[1.02rem] font-normal ${cardStyles.accent}`}>{displayPrice}</span>
              {hasSale && (
                <span className="text-[13px] text-wg-gray line-through">{originalPrice}</span>
              )}
            </div>

            {/* Botão */}
            <Button
              onClick={handleAddToCart}
              disabled={!available}
              className={`w-full rounded-full ${cardStyles.button} text-white transition-all duration-300 group-hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <ShoppingCart className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              {available ? t('storePage.productFallback.add') : 'Indisponível'}
            </Button>
          </div>

          {/* Borda inferior colorida - aparece no hover */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${cardStyles.line} transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100`} />
        </div>
      </Link>
    </motion.div>
  );
};

const ProductsList = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchProductsWithQuantities = async () => {
      try {
        setLoading(true);
        setError(null);

        const { getCategories, getProducts, getProductQuantities } = await import("@/api/EcommerceApi");

        const [productsResponse, categoriesResponse] = await Promise.all([
          getProducts(),
          getCategories().catch(() => ({ categories: [], count: 0 })),
        ]);

        if (productsResponse.products.length === 0) {
          setProducts([]);
          setCategories(categoriesResponse.categories || []);
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
        })).filter(hasProductImage);

        setProducts(productsWithQuantities);
        setCategories(categoriesResponse.categories || []);
      } catch (err) {
        setError(err.message || t('storePage.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchProductsWithQuantities();
  }, [t]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.title])),
    [categories]
  );

  const dynamicCategories = useMemo(() => {
    const seen = new Map();

    products.forEach((product) => {
      const collectionId = getPrimaryCollectionId(product);
      const label = getCategoryLabel(product, categoryMap);
      const key = collectionId || label;

      if (!seen.has(key)) {
        seen.set(key, {
          id: key,
          label,
          count: 0,
        });
      }

      seen.get(key).count += 1;
    });

    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [products, categoryMap]);

  const filteredProducts = useMemo(() => {
    const priceMatches = (product) => {
      const price = getProductPriceValue(product);
      if (priceFilter === 'up-to-50000') return price <= 50000;
      if (priceFilter === '50000-to-200000') return price > 50000 && price <= 200000;
      if (priceFilter === 'over-200000') return price > 200000;
      return true;
    };

    const availabilityMatches = (product) => {
      if (availabilityFilter === 'available') return isProductAvailable(product);
      if (availabilityFilter === 'unavailable') return !isProductAvailable(product);
      return true;
    };

    const categoryMatches = (product) => {
      if (selectedCategory === 'all') return true;
      const collectionId = getPrimaryCollectionId(product);
      return collectionId === selectedCategory || getCategoryLabel(product, categoryMap) === selectedCategory;
    };

    const items = products
      .filter(hasProductImage)
      .filter(categoryMatches)
      .filter(availabilityMatches)
      .filter(priceMatches);

    const sorted = [...items];

    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => getProductPriceValue(a) - getProductPriceValue(b));
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => getProductPriceValue(b) - getProductPriceValue(a));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [products, selectedCategory, availabilityFilter, priceFilter, sortBy, categoryMap]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#F25C26]" />
        <p className="text-[rgba(46,46,46,0.78)]">{t('storePage.loading')}</p>
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
    <div className="space-y-8">
      <div className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_40px_rgba(17,17,17,0.05)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="wg-overline mb-2 inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros dinâmicos do catálogo
            </p>
            <h3 className="text-2xl font-inter font-light tracking-[-0.03em] text-wg-black">
              Produtos organizados por categoria, faixa de preço e disponibilidade
            </h3>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="text-sm font-light text-wg-gray">
              {filteredProducts.length} de {products.length} produtos visíveis
            </p>
            <button
              type="button"
              onClick={() => setIsFiltersOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-[#F8F6F1] px-4 py-2 text-sm font-light text-wg-black transition hover:border-wg-blue/25 hover:bg-white"
              aria-expanded={isFiltersOpen}
            >
              {isFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
              <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isFiltersOpen ? (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`wg-filter-chip ${selectedCategory === 'all' ? 'wg-filter-chip-active' : ''}`}
              >
                Todas as categorias
              </button>
              {dynamicCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`wg-filter-chip ${selectedCategory === category.id ? 'wg-filter-chip-active' : ''}`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-light text-wg-gray">
                Disponibilidade
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  className="rounded-2xl border border-black/[0.08] bg-[#F8F6F1] px-4 py-3 text-wg-black outline-none transition focus:border-wg-blue/30"
                >
                  <option value="all">Todos</option>
                  <option value="available">Somente disponíveis</option>
                  <option value="unavailable">Somente indisponíveis</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-light text-wg-gray">
                Faixa de preço
                <select
                  value={priceFilter}
                  onChange={(event) => setPriceFilter(event.target.value)}
                  className="rounded-2xl border border-black/[0.08] bg-[#F8F6F1] px-4 py-3 text-wg-black outline-none transition focus:border-wg-blue/30"
                >
                  <option value="all">Todas as faixas</option>
                  <option value="up-to-50000">Até R$ 500</option>
                  <option value="50000-to-200000">R$ 500 a R$ 2.000</option>
                  <option value="over-200000">Acima de R$ 2.000</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-light text-wg-gray">
                Ordenar por
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-2xl border border-black/[0.08] bg-[#F8F6F1] px-4 py-3 text-wg-black outline-none transition focus:border-wg-blue/30"
                >
                  <option value="featured">Destaque</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="title">Nome</option>
                </select>
              </label>
            </div>
          </>
        ) : (
          <p className="mt-5 text-sm font-light leading-7 text-wg-gray">
            Os filtros ficam recolhidos por padrão para manter a vitrine mais limpa. Abra quando quiser refinar categoria, preço e disponibilidade.
          </p>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-[26px] border border-black/[0.06] bg-white p-12 text-center shadow-[0_18px_40px_rgba(17,17,17,0.05)]">
          <Package className="mx-auto mb-4 h-14 w-14 text-wg-gray/[0.45]" />
          <p className="text-lg font-light text-wg-black">Nenhum produto encontrado com os filtros atuais.</p>
          <p className="mt-2 text-sm font-light text-wg-gray">Ajuste categoria, preço ou disponibilidade para ampliar a seleção.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              categoryLabel={getCategoryLabel(product, categoryMap)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;





