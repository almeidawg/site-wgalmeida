import React from 'react';
import RegionTemplate from './RegionTemplate';

const Mooca = () => {
  return (
    <RegionTemplate
      regionKey="mooca"
      region="Mooca"
      title="Reforma Comercial e Corporativa na Mooca"
      metaDescription="Especialistas em reforma de espaços comerciais e corporativos na Mooca. Arquitetura integrada, engenharia e marcenaria premium para empresas. Sistema Turn Key completo."
      heroImage="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80"
      intro={[
        "A Mooca é uma região estratégica de São Paulo, com grande concentração de empresas e espaços corporativos. O Grupo WG Almeida é especialista em transformar ambientes comerciais em espaços modernos, funcionais e inspiradores.",
        "Com o sistema Turn Key Premium, oferecemos solução completa para reformas corporativas — arquitetura, engenharia e marcenaria integradas — garantindo mínima interrupção nas operações e prazos rigorosamente cumpridos."
      ]}
      highlights={[
        "Experiência em projetos corporativos de médio e grande porte",
        "Gestão de obra com mínima interrupção das operações",
        "Soluções para escritórios, lojas e espaços comerciais",
        "Cronograma otimizado para ambientes corporativos"
      ]}
    />
  );
};

export default Mooca;
