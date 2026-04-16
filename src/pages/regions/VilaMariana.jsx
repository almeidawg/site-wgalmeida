import React from 'react';
import RegionTemplate from './RegionTemplate';

const VilaMariana = () => {
  return (
    <RegionTemplate
      regionKey="vilamariana"
      region="Vila Mariana"
      title="Reforma de Apartamento na Vila Mariana | Turn Key Premium"
      metaDescription="Reforma de apartamento na Vila Mariana com arquitetura, engenharia e marcenaria integradas. Planejamento, execução e leitura guiada da obra em uma experiência mais simples."
      heroImage="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80"
      intro={[
        "A Vila Mariana é um dos bairros mais tradicionais e valorizados de São Paulo, conhecido por sua infraestrutura completa e qualidade de vida. O Grupo WG Almeida atua na região com arquitetura, engenharia e marcenaria integradas para transformar apartamentos e residências em espaços premium, funcionais e mais bem resolvidos.",
        "Com condução integrada do projeto à entrega, organizamos a reforma com qualidade superior, leitura guiada do andamento e menos coordenação manual para quem está acompanhando a obra.",
        "Isso ajuda a transformar a obra em defesa real do imóvel: mais previsibilidade, mais coerência técnica e mais clareza sobre o valor que está sendo protegido ou criado."
      ]}
      highlights={[
        "Experiência comprovada com mais de 30 projetos na região",
        "Conhecimento profundo das regulamentações e condomínios locais",
        "Acesso a fornecedores premium estabelecidos no bairro",
        "Garantia de 5 anos em toda obra e acabamentos"
      ]}
    />
  );
};

export default VilaMariana;
