import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const carouselProjects = [
  {
    titleKey: 'projectCarousel.projects.acapulco.title',
    subtitleKey: 'projectCarousel.projects.acapulco.subtitle',
    descriptionKey: 'projectCarousel.projects.acapulco.description',
    statKey: 'projectCarousel.projects.acapulco.stat',
    image: '/images/projects/casa-resort-acapulco/01_11---Photo.jpg',
    folder: 'casa-resort-acapulco',
  },
  {
    titleKey: 'projectCarousel.projects.alameda.title',
    subtitleKey: 'projectCarousel.projects.alameda.subtitle',
    descriptionKey: 'projectCarousel.projects.alameda.description',
    statKey: 'projectCarousel.projects.alameda.stat',
    image: '/images/projects/apartamento-alameda-alphaville/10areaservio_01_27206612818_o.jpg',
    folder: 'apartamento-alameda-alphaville',
  },
  {
    titleKey: 'projectCarousel.projects.lesChamps.title',
    subtitleKey: 'projectCarousel.projects.lesChamps.subtitle',
    descriptionKey: 'projectCarousel.projects.lesChamps.description',
    statKey: 'projectCarousel.projects.lesChamps.stat',
    image: '/images/projects/cobertura-les-champs-osasco/2022-03-11 13.30.30.jpg',
    folder: 'cobertura-les-champs-osasco',
  },
  {
    titleKey: 'projectCarousel.projects.lumenit.title',
    subtitleKey: 'projectCarousel.projects.lumenit.subtitle',
    descriptionKey: 'projectCarousel.projects.lumenit.description',
    statKey: 'projectCarousel.projects.lumenit.stat',
    image: '/images/projects/lumenit-corporativo/lumenit_27476900773_o.jpg',
    folder: 'lumenit-corporativo',
  },
  {
    titleKey: 'projectCarousel.projects.grandPanamby.title',
    subtitleKey: 'projectCarousel.projects.grandPanamby.subtitle',
    descriptionKey: 'projectCarousel.projects.grandPanamby.description',
    statKey: 'projectCarousel.projects.grandPanamby.stat',
    image: '/images/projects/apartamento-grand-panamby/2021-05-24 12.02.11.jpg',
    folder: 'apartamento-grand-panamby',
  },
  {
    titleKey: 'projectCarousel.projects.square.title',
    subtitleKey: 'projectCarousel.projects.square.subtitle',
    descriptionKey: 'projectCarousel.projects.square.description',
    statKey: 'projectCarousel.projects.square.stat',
    image: '/images/projects/apartamento-square-santo-amaro/Humanizada.png',
    folder: 'apartamento-square-santo-amaro',
  },
  {
    titleKey: 'projectCarousel.projects.gaivota.title',
    subtitleKey: 'projectCarousel.projects.gaivota.subtitle',
    descriptionKey: 'projectCarousel.projects.gaivota.description',
    statKey: 'projectCarousel.projects.gaivota.stat',
    image: '/images/projects/casa-gaivota-moema/1.jpg',
    folder: 'casa-gaivota-moema',
  },
  {
    titleKey: 'projectCarousel.projects.portaDoSol.title',
    subtitleKey: 'projectCarousel.projects.portaDoSol.subtitle',
    descriptionKey: 'projectCarousel.projects.portaDoSol.description',
    statKey: 'projectCarousel.projects.portaDoSol.stat',
    image: '/images/projects/casa-porta-do-sol-mairinque/2021-12-10 12.53.24.jpg',
    folder: 'casa-porta-do-sol-mairinque',
  },
  {
    titleKey: 'projectCarousel.projects.paulistano.title',
    subtitleKey: 'projectCarousel.projects.paulistano.subtitle',
    descriptionKey: 'projectCarousel.projects.paulistano.description',
    statKey: 'projectCarousel.projects.paulistano.stat',
    image: '/images/projects/condominio-paulistano-monte-kemel/original100.JPG',
    folder: 'condominio-paulistano-monte-kemel',
  },
  {
    titleKey: 'projectCarousel.projects.cureDent.title',
    subtitleKey: 'projectCarousel.projects.cureDent.subtitle',
    descriptionKey: 'projectCarousel.projects.cureDent.description',
    statKey: 'projectCarousel.projects.cureDent.stat',
    image: '/images/projects/consultorio-cure-dent-cotia/2020-10-06 13.39.14.jpg',
    folder: 'consultorio-cure-dent-cotia',
  },
  {
    titleKey: 'projectCarousel.projects.surubiju.title',
    subtitleKey: 'projectCarousel.projects.surubiju.subtitle',
    descriptionKey: 'projectCarousel.projects.surubiju.description',
    statKey: 'projectCarousel.projects.surubiju.stat',
    image: '/images/projects/galpao-surubiju-alphaville/1.jpg',
    folder: 'galpao-surubiju-alphaville',
  },
];

const ProjectCarousel = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeProject = useMemo(() => carouselProjects[activeIndex], [activeIndex]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + carouselProjects.length) % carouselProjects.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % carouselProjects.length);
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-custom space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-wg-apple-muted">{t('projectCarousel.kicker')}</p>
            <h2 className="text-3xl font-oswald text-wg-apple-accent">{t('projectCarousel.title')}</h2>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-full border border-wg-apple-highlight bg-white p-2 transition hover:border-wg-apple-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-wg-apple-accent"
              aria-label={t('projectCarousel.previous')}
            >
              <ArrowLeft className="h-4 w-4 text-wg-apple-accent" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full border border-wg-apple-highlight bg-white p-2 transition hover:border-wg-apple-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-wg-apple-accent"
              aria-label={t('projectCarousel.next')}
            >
              <ArrowRight className="h-4 w-4 text-wg-apple-accent" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="relative h-[420px] overflow-hidden rounded-[32px] border border-wg-apple-highlight bg-wg-apple-surface shadow-apple-card">
            <img
              src={activeProject.image}
              alt={t(activeProject.titleKey)}
              width={800}
              height={420}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 ease-out hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wg-apple-accent/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 space-y-3 text-white">
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">{t(activeProject.subtitleKey)}</p>
              <h3 className="text-3xl font-semibold">{t(activeProject.titleKey)}</h3>
              <p className="text-sm leading-relaxed">{t(activeProject.descriptionKey)}</p>
            </div>
          </div>
          <div className="flex flex-col rounded-[32px] border border-wg-apple-highlight bg-white p-6 shadow-apple-card">
            <p className="text-sm uppercase tracking-[0.4em] text-wg-apple-muted">{t('projectCarousel.details')}</p>
            <p className="mt-4 text-2xl font-semibold text-wg-apple-accent">{t(activeProject.statKey)}</p>
            <p className="mt-6 text-sm text-wg-apple-muted leading-relaxed">{t(activeProject.descriptionKey)}</p>
            <div className="mt-auto flex gap-3">
              {carouselProjects.map((project, idx) => (
                <button
                  key={project.titleKey}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 flex-1 rounded-full transition ${
                    idx === activeIndex ? 'bg-wg-apple-accent' : 'bg-wg-apple-highlight/50'
                  }`}
                  aria-label={t('projectCarousel.goTo', { title: t(project.titleKey) })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectCarousel;
