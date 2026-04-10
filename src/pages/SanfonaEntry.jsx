import { Link } from 'react-router-dom';

const nuclei = [
  {
    id: 'arquitetura',
    index: '01',
    name: 'Arquitetura',
    description: 'Projetos, interiores e espaços com leitura autoral.',
    accent: 'text-wg-green',
    border: 'border-wg-green/20',
    glow: 'from-wg-green/10 to-transparent',
    image: '/images/banners/foto-obra-1.jpg',
    path: '/arquitetura',
  },
  {
    id: 'engenharia',
    index: '02',
    name: 'Engenharia',
    description: 'Obras, compatibilização e gestão com precisão executiva.',
    accent: 'text-wg-blue',
    border: 'border-wg-blue/20',
    glow: 'from-wg-blue/10 to-transparent',
    image: '/images/banners/foto-obra-2.jpg',
    path: '/engenharia',
  },
  {
    id: 'marcenaria',
    index: '03',
    name: 'Marcenaria',
    description: 'Mobiliário sob medida com desenho técnico e acabamento premium.',
    accent: 'text-wg-orange',
    border: 'border-wg-orange/20',
    glow: 'from-wg-orange/10 to-transparent',
    image: '/images/banners/foto-obra-3.jpg',
    path: '/marcenaria',
  },
];

export default function SanfonaEntry() {
  return (
    <section className="min-h-screen bg-[#F7F5F1] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-wg-gray">Núcleos WG Almeida</p>
          <h1 className="text-4xl font-light tracking-tight text-wg-black md:text-5xl">
            Três núcleos, uma entrega integrada.
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {nuclei.map((nucleus) => (
            <Link
              key={nucleus.id}
              to={nucleus.path}
              className={`group relative overflow-hidden rounded-[32px] border bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition duration-500 hover:-translate-y-1 ${nucleus.border}`}
            >
              <div className="relative h-[520px]">
                <img
                  src={nucleus.image}
                  alt={nucleus.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                <div className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${nucleus.glow}`} />

                <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                  <p className={`mb-4 text-sm uppercase tracking-[0.3em] ${nucleus.accent}`}>{nucleus.index}</p>
                  <h2 className="mb-4 text-3xl font-light tracking-tight">{nucleus.name}</h2>
                  <p className="max-w-sm text-base leading-relaxed text-white/82">{nucleus.description}</p>
                  <span className="mt-6 inline-flex items-center rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.28em] text-white/92 transition group-hover:border-white/60">
                    Explorar unidade
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
