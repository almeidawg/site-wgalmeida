import React from 'react';
import RegionTemplate from './RegionTemplate';

const Mooca = () => {
  return (
    <RegionTemplate
      regionKey="mooca"
      region="Mooca"
      title="Reforma Comercial e Corporativa na Mooca"
      metaDescription="Especialistas em reforma de espaços comerciais e corporativos na Mooca. Arquitetura, engenharia e marcenaria integradas para empresas, com leitura guiada da obra e menos coordenação manual."
      heroImage="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80"
      intro={[
        "A Mooca é uma região estratégica de São Paulo, com grande concentração de empresas e espaços corporativos. O Grupo WG Almeida atua transformando ambientes comerciais em espaços mais claros, funcionais e inspiradores.",
        "Com condução integrada de arquitetura, engenharia e marcenaria, organizamos a reforma corporativa com leitura guiada, mínima interrupção da operação e prazos mais previsíveis.",
        "A lógica não é só executar a obra. É sustentar melhor a operação e o valor do espaço com menos ruído, mais controle e uma tese mais defensável para quem decide."
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
