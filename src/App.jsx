import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
// import ClaudeAssistant from '@/components/ClaudeAssistant'; // DESATIVADO TEMPORARIAMENTE - Manter apenas WhatsApp
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));
const AMarca = lazy(() => import('@/pages/AMarca'));
const Architecture = lazy(() => import('@/pages/Architecture'));
const Engineering = lazy(() => import('@/pages/Engineering'));
const Carpentry = lazy(() => import('@/pages/Carpentry'));
const Projects = lazy(() => import('@/pages/Projects'));
const Process = lazy(() => import('@/pages/Process'));
const Testimonials = lazy(() => import('@/pages/Testimonials'));
const Contact = lazy(() => import('@/pages/Contact'));
const Store = lazy(() => import('@/pages/Store'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const Success = lazy(() => import('@/pages/Success'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Account = lazy(() => import('@/pages/Account'));
const Admin = lazy(() => import('@/pages/Admin'));

// Region Pages (SEO)
const Brooklin = lazy(() => import('@/pages/regions/Brooklin'));
const VilaNovaConceicao = lazy(() => import('@/pages/regions/VilaNovaConceicao'));
const Itaim = lazy(() => import('@/pages/regions/Itaim'));
const Jardins = lazy(() => import('@/pages/regions/Jardins'));
const CidadeJardim = lazy(() => import('@/pages/regions/CidadeJardim'));
const Morumbi = lazy(() => import('@/pages/regions/Morumbi'));
const VilaMariana = lazy(() => import('@/pages/regions/VilaMariana'));
const Mooca = lazy(() => import('@/pages/regions/Mooca'));
const SoliciteProposta = lazy(() => import('@/pages/SoliciteProposta'));
const Blog = lazy(() => import('@/pages/Blog'));
const FAQ = lazy(() => import('@/pages/FAQ'));

const LoadingFallback = () => (
  <div className="min-h-screen w-full flex justify-center items-center bg-white">
    <Loader2 className="h-16 w-16 text-wg-orange animate-spin" />
  </div>
);

function App() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow pt-20 bg-white">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/a-marca" element={<AMarca />} />
            <Route path="/arquitetura" element={<Architecture />} />
            <Route path="/engenharia" element={<Engineering />} />
            <Route path="/marcenaria" element={<Carpentry />} />
            <Route path="/projetos" element={<Projects />} />
            <Route path="/processo" element={<Process />} />
            <Route path="/depoimentos" element={<Testimonials />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/solicite-sua-proposta" element={<SoliciteProposta />} />
            <Route path="/solicite-proposta" element={<SoliciteProposta />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<Blog />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Region Pages (SEO) */}
            <Route path="/brooklin" element={<Brooklin />} />
            <Route path="/vila-nova-conceicao" element={<VilaNovaConceicao />} />
            <Route path="/itaim" element={<Itaim />} />
            <Route path="/jardins" element={<Jardins />} />
            <Route path="/cidade-jardim" element={<CidadeJardim />} />
            <Route path="/morumbi" element={<Morumbi />} />
            <Route path="/vila-mariana" element={<VilaMariana />} />
            <Route path="/mooca" element={<Mooca />} />

            {/* Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Store Pages */}
            <Route path="/store" element={<Store />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/success" element={<Success />} />

            {/* Protected Routes */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      {/* <ClaudeAssistant /> */} {/* DESATIVADO - Manter apenas WhatsApp */}
    </div>
  );
}

export default App;