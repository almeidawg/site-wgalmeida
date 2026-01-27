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
const AltoDePinheiros = lazy(() => import('@/pages/regions/AltoDePinheiros'));
const Moema = lazy(() => import('@/pages/regions/Moema'));
const CampoBelo = lazy(() => import('@/pages/regions/CampoBelo'));
const Higienopolis = lazy(() => import('@/pages/regions/Higienopolis'));
const Pinheiros = lazy(() => import('@/pages/regions/Pinheiros'));
const Perdizes = lazy(() => import('@/pages/regions/Perdizes'));
const Paraiso = lazy(() => import('@/pages/regions/Paraiso'));
const Aclimacao = lazy(() => import('@/pages/regions/Aclimacao'));
const SoliciteProposta = lazy(() => import('@/pages/SoliciteProposta'));
const Blog = lazy(() => import('@/pages/Blog'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Moodboard = lazy(() => import('@/pages/Moodboard'));
const RoomVisualizer = lazy(() => import('@/pages/RoomVisualizer'));
const RevistaEstilos = lazy(() => import('@/pages/RevistaEstilos'));
const EstiloDetail = lazy(() => import('@/pages/EstiloDetail'));

// Landing Pages Estratégicas (SEO)
const ConstrutoraAltoPadraoSP = lazy(() => import('@/pages/ConstrutoraAltoPadraoSP'));
const ReformaApartamentoSP = lazy(() => import('@/pages/ReformaApartamentoSP'));
const ArquiteturaCorporativa = lazy(() => import('@/pages/ArquiteturaCorporativa'));
const ObraTurnKey = lazy(() => import('@/pages/ObraTurnKey'));

// Landing Pages Serviço + Bairro (SEO Local)
const ReformaApartamentoItaim = lazy(() => import('@/pages/ReformaApartamentoItaim'));
const ReformaApartamentoJardins = lazy(() => import('@/pages/ReformaApartamentoJardins'));
const ConstrutoraBrooklin = lazy(() => import('@/pages/ConstrutoraBrooklin'));
const MarcenariaSobMedidaMorumbi = lazy(() => import('@/pages/MarcenariaSobMedidaMorumbi'));
const ArquiteturaInterioresVilaNovaConceicao = lazy(() => import('@/pages/ArquiteturaInterioresVilaNovaConceicao'));

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
            <Route path="/revista-estilos" element={<RevistaEstilos />} />
            <Route path="/estilos/:slug" element={<EstiloDetail />} />

            {/* Moodboard & Room Visualizer */}
            <Route path="/moodboard" element={<Moodboard />} />
            <Route path="/room-visualizer" element={<RoomVisualizer />} />
            <Route path="/visualizador-ambientes" element={<RoomVisualizer />} />

            {/* Landing Pages Estratégicas (SEO) */}
            <Route path="/construtora-alto-padrao-sp" element={<ConstrutoraAltoPadraoSP />} />
            <Route path="/reforma-apartamento-sp" element={<ReformaApartamentoSP />} />
            <Route path="/arquitetura-corporativa" element={<ArquiteturaCorporativa />} />
            <Route path="/obra-turn-key" element={<ObraTurnKey />} />

            {/* Landing Pages Serviço + Bairro (SEO Local) */}
            <Route path="/reforma-apartamento-itaim" element={<ReformaApartamentoItaim />} />
            <Route path="/reforma-apartamento-jardins" element={<ReformaApartamentoJardins />} />
            <Route path="/construtora-brooklin" element={<ConstrutoraBrooklin />} />
            <Route path="/marcenaria-sob-medida-morumbi" element={<MarcenariaSobMedidaMorumbi />} />
            <Route path="/arquitetura-interiores-vila-nova-conceicao" element={<ArquiteturaInterioresVilaNovaConceicao />} />

            {/* Region Pages (SEO) */}
            <Route path="/brooklin" element={<Brooklin />} />
            <Route path="/vila-nova-conceicao" element={<VilaNovaConceicao />} />
            <Route path="/itaim" element={<Itaim />} />
            <Route path="/jardins" element={<Jardins />} />
            <Route path="/cidade-jardim" element={<CidadeJardim />} />
            <Route path="/morumbi" element={<Morumbi />} />
            <Route path="/vila-mariana" element={<VilaMariana />} />
            <Route path="/mooca" element={<Mooca />} />
            <Route path="/alto-de-pinheiros" element={<AltoDePinheiros />} />
            <Route path="/moema" element={<Moema />} />
            <Route path="/campo-belo" element={<CampoBelo />} />
            <Route path="/higienopolis" element={<Higienopolis />} />
            <Route path="/pinheiros" element={<Pinheiros />} />
            <Route path="/perdizes" element={<Perdizes />} />
            <Route path="/paraiso" element={<Paraiso />} />
            <Route path="/aclimacao" element={<Aclimacao />} />

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