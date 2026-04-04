import React from 'react';
import RegionTemplate from './RegionTemplate';

const VilaMariana = () => {
  return (
    <RegionTemplate
      regionKey="vilamariana"
      region="Vila Mariana"
      title="Reforma de Apartamento na Vila Mariana | Turn Key Premium"
      metaDescription="Reforma de apartamento na Vila Mariana com arquitetura, engenharia e marcenaria integradas. Sistema turn key premium com planejamento e execucao completa."
      heroImage="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80"
      intro={[
        "A Vila Mariana é um dos bairros mais tradicionais e valorizados de São Paulo, conhecido por sua infraestrutura completa e qualidade de vida. O Grupo WG Almeida atua há mais de 14 anos transformando apartamentos e residências nesta região em espaços premium e funcionais.",
        "Com o sistema Turn Key Premium, oferecemos solução completa — arquitetura, engenharia e marcenaria integradas — garantindo qualidade superior e prazos previsíveis para seus projetos na Vila Mariana."
      ]}
      highlights={[
        "Experiência comprovada com mais de 30 projetos na região",
        "Conhecimento profundo das regulamentações e condomínios locais",
        "Acesso a fornecedores premium estabelecidos no bairro",
        "Garantia de 5 anos em toda obra e acabados"
      ]}
    />
  );
};

export default VilaMariana;
