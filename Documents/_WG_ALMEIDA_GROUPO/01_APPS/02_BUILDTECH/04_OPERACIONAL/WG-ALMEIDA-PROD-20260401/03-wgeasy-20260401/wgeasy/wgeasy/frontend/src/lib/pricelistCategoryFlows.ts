import type { PricelistCategoryFlow } from "@/types/pricelist";

const baseFlow: Omit<PricelistCategoryFlow, "id" | "nome"> = {
  descricao:
    "Fluxo de trabalho documentado para cada categoria/listagem do pricelist. Use as fases como base para automatizar tarefas por ambientes, kits e composições.",
  fases: [],
};

export const PRICELIST_CATEGORY_FLOWS: Record<string, PricelistCategoryFlow> = {
  pontoTomada: {
    ...baseFlow,
    id: "ponto-tomada",
    nome: "Ponto de Tomada 110V / IluminaçÍo de Piso",
    fases: [
      {
        id: "eletrica",
        nome: "Execucao eletrica",
        descricao:
          "Etapas eletricas principais para instalar o ponto de tomada, incluindo material de acabamento imediato e itens de seguranca.",
        tasks: [
          {
            id: "rasgar-alvenaria",
            nome: "Rasgar alvenaria",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Makita",
              insumo: "Disco de Makita",
              epi: "Oculos + Luvas"
            },
            kits: ["Kit eletro basico"],
            ambientes: ["Sala de estar", "Hall social"]
          },
          {
            id: "colocar-conduite",
            nome: "Colocar conduite",
            tempoEstimadoMinutos: 20,
            recursos: {
              infra: "Conduite 3/4"
            },
            kits: ["Tubulacao eletrica"],
            ambientes: ["Sala de estar"]
          },
          {
            id: "instalar-caixa",
            nome: "Instalar caixa 4x2",
            tempoEstimadoMinutos: 15,
            recursos: {
              infra: "Caixa 4x2"
            },
            kits: ["Caixas modulares"]
          },
          {
            id: "passar-fios",
            nome: "Passar fios",
            tempoEstimadoMinutos: 25,
            recursos: {
              infra: "Fita isolante"
            }
          },
          {
            id: "fechar-alvenaria",
            nome: "Fechar alvenaria",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Lubrificante"
            },
            kits: ["Gesso de ajuste"]
          },
          {
            id: "instalar-modulo",
            nome: "Instalar modulo + espelho",
            tempoEstimadoMinutos: 30,
            recursos: {
              materialCinza: "Gesso Seca Rapido, Estopa",
              produto: "Modulo tomada + espelho"
            },
            ambientes: ["Sala de estar", "Sala intima"]
          },
          {
            id: "confere-acabamento",
            nome: "Ajustar acabamento e protecao",
            tempoEstimadoMinutos: 10,
            recursos: {
              materialCinza: "Estopa",
              produto: "Luminaria de piso decorativa"
            }
          }
        ]
      }
    ]
  },
  pintura: {
    ...baseFlow,
    id: "pintura",
    nome: "Pintura decorativa e acabamento",
    fases: [
      {
        id: "preparacao-pintura",
        nome: "Preparacao e pintura",
        descricao:
          "Sequencia logica para emassar, lixar, aplicar seladora e pintar, sempre respeitando os recursos e kits selecionados.",
        tasks: [
          {
            id: "emassar",
            nome: "Emassar superficies",
            tempoEstimadoMinutos: 40,
            recursos: {
              ferramenta: "Pincel + desempenadeira",
              insumo: "Caçamba de pintura",
              epi: "Mascara + Oculos"
            },
            kits: ["Kit pintura premium"],
            ambientes: ["Sala de estar", "Corredor"]
          },
          {
            id: "lixar",
            nome: "Lixar com grao fino",
            tempoEstimadoMinutos: 20,
            recursos: {
              insumo: "Lixa 150 / Lixa 110",
              epi: "Mascara + Luvas"
            }
          },
          {
            id: "pintar",
            nome: "Aplicar tinta de acabamento",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Rolo + trincha",
              insumo: "Tinta Suvinil",
              acabamento: "Lixa 150 para retoque",
              produto: "Fundo + seladora"
            }
          },
          {
            id: "detalhes-finais",
            nome: "Finalizar com acessorios",
            tempoEstimadoMinutos: 15,
            recursos: {
              materialCinza: "Fita crepe",
              produto: "Suporte e luminaria de piso"
            },
            kits: ["Kit iluminaçÍo decorativa"],
            ambientes: ["Sala de estar", "Sala intima"]
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Ar Condicionado Split (4 fases completas)
  // ============================================================
  arCondicionado: {
    ...baseFlow,
    id: "ar-condicionado",
    nome: "Ar Condicionado Split — Fluxo Completo",
    descricao: "Fluxo completo de instalaçÍo de ar condicionado split, desde infraestrutura até comissionamento. Referências: SINAPI, fabricantes Daikin/Samsung/LG.",
    fases: [
      {
        id: "ac-infra",
        nome: "Infraestrutura",
        descricao: "Abertura de rasgos, passagem de tubulaçÍo, dreno e cabo elétrico.",
        tasks: [
          {
            id: "ac-rasgo-parede",
            nome: "Abertura de rasgo na parede",
            tempoEstimadoMinutos: 40,
            recursos: {
              ferramenta: "Makita / Martelete",
              epi: "Óculos + Luvas + Máscara"
            }
          },
          {
            id: "ac-tubo-cobre",
            nome: "Passagem de tubulaçÍo de cobre",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Tubo cobre 1/4\" + 3/8\", Isolamento elastomérico"
            }
          },
          {
            id: "ac-dreno",
            nome: "Passagem de dreno",
            tempoEstimadoMinutos: 15,
            recursos: {
              insumo: "Mangueira dreno PVC 25mm"
            }
          },
          {
            id: "ac-cabo",
            nome: "Passagem de cabo elétrico",
            tempoEstimadoMinutos: 20,
            recursos: {
              insumo: "Cabo PP 3x2.5mm"
            }
          },
          {
            id: "ac-protecao-isolamento",
            nome: "ProteçÍo e isolamento",
            tempoEstimadoMinutos: 15,
            recursos: {
              insumo: "Silver tape, Fita autofusÍo"
            }
          },
          {
            id: "ac-fechar-rasgo",
            nome: "Fechamento do rasgo",
            tempoEstimadoMinutos: 30,
            recursos: {
              infra: "Gesso / Argamassa"
            }
          },
          {
            id: "ac-caixa-passagem",
            nome: "InstalaçÍo de caixa de passagem",
            tempoEstimadoMinutos: 15,
            recursos: {
              infra: "Caixa de passagem"
            }
          },
          {
            id: "ac-mdo-infra",
            nome: "MDO Infra de Ar Condicionado",
            tempoEstimadoMinutos: 120,
            recursos: {
              materialCinza: "MDO Infra completa por ponto"
            }
          }
        ]
      },
      {
        id: "ac-instalacao",
        nome: "InstalaçÍo Mecânica",
        descricao: "FixaçÍo de suportes, instalaçÍo de evaporadora e condensadora, conexões.",
        tasks: [
          {
            id: "ac-suporte-cond",
            nome: "FixaçÍo do suporte da condensadora",
            tempoEstimadoMinutos: 20,
            recursos: {
              infra: "Suporte metálico, Parafusos + Buchas fixaçÍo",
              ferramenta: "Furadeira, Nível"
            }
          },
          {
            id: "ac-evaporadora",
            nome: "InstalaçÍo da evaporadora",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Nível, Furadeira"
            }
          },
          {
            id: "ac-condensadora",
            nome: "InstalaçÍo da condensadora",
            tempoEstimadoMinutos: 20,
            recursos: {
              ferramenta: "Chave de torque"
            }
          },
          {
            id: "ac-conexao-tubos",
            nome: "ConexÍo das tubulações (flangeamento)",
            tempoEstimadoMinutos: 25,
            recursos: {
              ferramenta: "Flangeador, Torquímetro"
            }
          },
          {
            id: "ac-conexao-eletrica",
            nome: "ConexÍo elétrica + disjuntor",
            tempoEstimadoMinutos: 20,
            recursos: {
              infra: "Disjuntor, Caixa de passagem"
            }
          }
        ]
      },
      {
        id: "ac-testes",
        nome: "Testes e Comissionamento",
        descricao: "Teste de estanqueidade, vácuo, carga de gás e teste de funcionamento.",
        tasks: [
          {
            id: "ac-estanqueidade",
            nome: "Teste de estanqueidade",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Manômetro, Nitrogênio"
            }
          },
          {
            id: "ac-vacuo",
            nome: "Vácuo do sistema",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Bomba de vácuo, Vacuômetro"
            }
          },
          {
            id: "ac-carga-gas",
            nome: "Carga de gás refrigerante",
            tempoEstimadoMinutos: 20,
            recursos: {
              insumo: "Gás R410A"
            }
          },
          {
            id: "ac-teste-func",
            nome: "Teste de funcionamento",
            tempoEstimadoMinutos: 15,
            recursos: {
              ferramenta: "Termômetro digital"
            }
          }
        ]
      },
      {
        id: "ac-equipamento",
        nome: "Equipamento",
        descricao: "Equipamento Split Hi-Wall — produto final.",
        tasks: [
          {
            id: "ac-split",
            nome: "Split Hi-Wall Inverter",
            recursos: {
              produto: "Split Inverter (9k / 12k / 18k / 24k BTU)"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Elétrica (3 fases)
  // ============================================================
  eletrica: {
    ...baseFlow,
    id: "eletrica",
    nome: "Elétrica — Fluxo Completo",
    descricao: "Fluxo de instalaçÍo elétrica residencial: infraestrutura, passagem de fiaçÍo e acabamento. Referências: SINAPI, NBR 5410.",
    fases: [
      {
        id: "ele-infra",
        nome: "Infraestrutura",
        descricao: "Rasgos, conduítes, caixas de passagem e fiaçÍo.",
        tasks: [
          {
            id: "ele-rasgo",
            nome: "Rasgo na alvenaria",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Makita / Martelete",
              epi: "Óculos + Luvas + Máscara"
            }
          },
          {
            id: "ele-conduite",
            nome: "ColocaçÍo de conduíte",
            tempoEstimadoMinutos: 25,
            recursos: {
              insumo: "Conduíte 3/4\", Abraçadeiras"
            }
          },
          {
            id: "ele-caixas",
            nome: "InstalaçÍo de caixas",
            tempoEstimadoMinutos: 15,
            recursos: {
              insumo: "Caixa 4x2, Caixa octogonal"
            }
          },
          {
            id: "ele-fiacao",
            nome: "Passagem de fiaçÍo",
            tempoEstimadoMinutos: 40,
            recursos: {
              insumo: "Fio 2.5mm, Fio 4mm, Fita isolante"
            }
          },
          {
            id: "ele-fechar",
            nome: "Fechamento de rasgos",
            tempoEstimadoMinutos: 25,
            recursos: {
              infra: "Argamassa / Gesso"
            }
          }
        ]
      },
      {
        id: "ele-quadro",
        nome: "Montagem do Quadro",
        descricao: "InstalaçÍo do quadro de distribuiçÍo e disjuntores.",
        tasks: [
          {
            id: "ele-qdc",
            nome: "InstalaçÍo do QDC",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Quadro de distribuiçÍo"
            }
          },
          {
            id: "ele-disjuntores",
            nome: "InstalaçÍo de disjuntores",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Disjuntores (10A a 40A)"
            }
          },
          {
            id: "ele-barramento",
            nome: "Barramento e conexões",
            tempoEstimadoMinutos: 20,
            recursos: {
              insumo: "Barramento, Terminal de conexÍo"
            }
          }
        ]
      },
      {
        id: "ele-acabamento",
        nome: "Acabamento",
        descricao: "InstalaçÍo de tomadas, interruptores e teste de circuitos.",
        tasks: [
          {
            id: "ele-tomadas",
            nome: "InstalaçÍo de tomadas",
            tempoEstimadoMinutos: 15,
            recursos: {
              produto: "Módulos tomada, Espelhos"
            }
          },
          {
            id: "ele-interruptores",
            nome: "InstalaçÍo de interruptores",
            tempoEstimadoMinutos: 15,
            recursos: {
              produto: "Módulos interruptor"
            }
          },
          {
            id: "ele-teste",
            nome: "Teste de circuitos",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Multímetro"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Hidrossanitária (3 fases)
  // ============================================================
  hidrossanitaria: {
    ...baseFlow,
    id: "hidrossanitaria",
    nome: "Hidrossanitária — Fluxo Completo",
    descricao: "Fluxo de instalaçÍo hidrossanitária: água fria/quente, esgoto e acabamento. Referências: SINAPI, NBR 5626/8160.",
    fases: [
      {
        id: "hid-agua",
        nome: "Água Fria e Quente",
        descricao: "TubulaçÍo de água fria (PVC) e quente (CPVC/PPR), registros e teste de pressÍo.",
        tasks: [
          {
            id: "hid-rasgo",
            nome: "Rasgo e abertura",
            tempoEstimadoMinutos: 40,
            recursos: {
              ferramenta: "Martelete",
              epi: "Óculos + Luvas"
            }
          },
          {
            id: "hid-agua-fria",
            nome: "TubulaçÍo de água fria",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Tubo PVC soldável 25mm, Conexões PVC (joelhos, tês, luvas)"
            }
          },
          {
            id: "hid-agua-quente",
            nome: "TubulaçÍo de água quente",
            tempoEstimadoMinutos: 50,
            recursos: {
              insumo: "Tubo CPVC/PPR, Conexões CPVC/PPR"
            }
          },
          {
            id: "hid-teste-pressao",
            nome: "Teste de pressÍo",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Bomba de teste de pressÍo"
            }
          },
          {
            id: "hid-fechar-rasgo",
            nome: "Fechamento de rasgos",
            tempoEstimadoMinutos: 30,
            recursos: {
              infra: "Argamassa / Gesso"
            }
          }
        ]
      },
      {
        id: "hid-esgoto",
        nome: "Esgoto",
        descricao: "TubulaçÍo de esgoto, ralos e sifões.",
        tasks: [
          {
            id: "hid-tubo-esgoto",
            nome: "TubulaçÍo de esgoto",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Tubo PVC esgoto 50mm/100mm, Conexões PVC esgoto"
            }
          },
          {
            id: "hid-ralos-sifoes",
            nome: "Ralos e sifões",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Ralos secos, Sifões"
            }
          },
          {
            id: "hid-ligacao-rede",
            nome: "LigaçÍo à rede",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Conexões PVC, Adesivo plástico"
            }
          }
        ]
      },
      {
        id: "hid-acabamento",
        nome: "Acabamento",
        descricao: "InstalaçÍo de registros e teste final.",
        tasks: [
          {
            id: "hid-registros",
            nome: "InstalaçÍo de registros",
            tempoEstimadoMinutos: 25,
            recursos: {
              produto: "Registros de pressÍo, Registros de gaveta"
            }
          },
          {
            id: "hid-teste-final",
            nome: "Teste final de vazamento",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Manômetro"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Arquitetura (3 fases)
  // ============================================================
  arquitetura: {
    ...baseFlow,
    id: "arquitetura",
    nome: "Arquitetura — Projeto Completo",
    descricao: "Fluxo do projeto arquitetônico: desde briefing até detalhamento executivo. Referências: CAU, Tabela de Honorários IAB.",
    fases: [
      {
        id: "arq-concepcao",
        nome: "ConcepçÍo e Estudo Preliminar",
        descricao: "Briefing com o cliente, levantamento do local e estudo preliminar de layout.",
        tasks: [
          {
            id: "arq-briefing",
            nome: "Briefing com o cliente",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Formulário de briefing, Tablet/notebook"
            }
          },
          {
            id: "arq-levantamento",
            nome: "Levantamento arquitetônico (as-built)",
            tempoEstimadoMinutos: 240,
            recursos: {
              ferramenta: "Trena laser, Medidor Bosch/Leica",
              epi: "Capacete (se obra)"
            }
          },
          {
            id: "arq-estudo-preliminar",
            nome: "Estudo preliminar de layout",
            tempoEstimadoMinutos: 480,
            recursos: {
              ferramenta: "AutoCAD / SketchUp / Revit"
            }
          },
          {
            id: "arq-moodboard",
            nome: "Moodboard e referências visuais",
            tempoEstimadoMinutos: 180,
            recursos: {
              ferramenta: "Pinterest, Figma, Photoshop"
            }
          }
        ]
      },
      {
        id: "arq-anteprojeto",
        nome: "Anteprojeto",
        descricao: "Desenvolvimento do anteprojeto com plantas, cortes, elevações e renders 3D.",
        tasks: [
          {
            id: "arq-planta-layout",
            nome: "Planta de layout e demolir/construir",
            tempoEstimadoMinutos: 360,
            recursos: {
              ferramenta: "AutoCAD / Revit"
            }
          },
          {
            id: "arq-render-3d",
            nome: "Modelagem 3D e renders",
            tempoEstimadoMinutos: 480,
            recursos: {
              ferramenta: "SketchUp / 3ds Max / V-Ray / Enscape"
            }
          },
          {
            id: "arq-apresentacao",
            nome: "ApresentaçÍo ao cliente",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "PDF / Pranchas impressas"
            }
          }
        ]
      },
      {
        id: "arq-executivo",
        nome: "Projeto Executivo e Detalhamento",
        descricao: "Pranchas executivas com todas as cotas, detalhes construtivos e especificações.",
        tasks: [
          {
            id: "arq-plantas-exec",
            nome: "Plantas executivas (layout, piso, forro, elétrica, hidráulica)",
            tempoEstimadoMinutos: 960,
            recursos: {
              ferramenta: "AutoCAD / Revit"
            }
          },
          {
            id: "arq-detalhamentos",
            nome: "Detalhamentos construtivos",
            tempoEstimadoMinutos: 480,
            recursos: {
              ferramenta: "AutoCAD"
            }
          },
          {
            id: "arq-memorial",
            nome: "Memorial descritivo e caderno de especificações",
            tempoEstimadoMinutos: 240,
            recursos: {
              ferramenta: "Word / PDF"
            }
          },
          {
            id: "arq-quantitativo",
            nome: "Levantamento quantitativo",
            tempoEstimadoMinutos: 360,
            recursos: {
              ferramenta: "Excel / Sistema WG"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: DocumentaçÍo (2 fases)
  // ============================================================
  documentacao: {
    ...baseFlow,
    id: "documentacao",
    nome: "DocumentaçÍo — Licenças e Aprovações",
    descricao: "Fluxo de documentaçÍo legal: ART/RRT, aprovaçÍo prefeitura, licenças e alvarás.",
    fases: [
      {
        id: "doc-registro",
        nome: "Registro Profissional",
        descricao: "ART/RRT e registro do responsável técnico.",
        tasks: [
          {
            id: "doc-art",
            nome: "EmissÍo de ART/RRT",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Portal CAU/CREA"
            }
          },
          {
            id: "doc-procuracao",
            nome: "ProcuraçÍo e documentos do proprietário",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Cópias autenticadas, Reconhecimento firma"
            }
          },
          {
            id: "doc-matricula",
            nome: "Matrícula do imóvel e IPTU",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Cartório / Prefeitura"
            }
          }
        ]
      },
      {
        id: "doc-aprovacao",
        nome: "AprovaçÍo e Licenças",
        descricao: "Protocolo na prefeitura, alvará de construçÍo e habite-se.",
        tasks: [
          {
            id: "doc-protocolo",
            nome: "Protocolo na prefeitura",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Pranchas plotadas, Formulários prefeitura"
            }
          },
          {
            id: "doc-alvara",
            nome: "Alvará de construçÍo/reforma",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Portal prefeitura"
            }
          },
          {
            id: "doc-condominio",
            nome: "AprovaçÍo do condomínio (se aplicável)",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Carta de autorizaçÍo, Projeto simplificado"
            }
          },
          {
            id: "doc-bombeiro",
            nome: "AVCB / CLCB (Corpo de Bombeiros)",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Portal Bombeiros, Projeto de incêndio"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Pré Obra & Proteções (2 fases)
  // ============================================================
  preObraProtecoes: {
    ...baseFlow,
    id: "pre-obra-protecoes",
    nome: "Pré Obra & Proteções — PreparaçÍo do Canteiro",
    descricao: "ProteçÍo de áreas comuns e internas, sinalizaçÍo e logística de início de obra.",
    fases: [
      {
        id: "pre-protecao",
        nome: "ProteçÍo de Áreas",
        descricao: "ProteçÍo de pisos, elevadores, hall e áreas comuns do condomínio.",
        tasks: [
          {
            id: "pre-piso",
            nome: "ProteçÍo de piso existente (papelÍo + lona)",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "PapelÍo ondulado, Lona plástica 150μ",
              epi: "Luvas"
            }
          },
          {
            id: "pre-elevador",
            nome: "ProteçÍo de elevador",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Compensado 6mm, Fita crepe larga, PapelÍo"
            }
          },
          {
            id: "pre-hall",
            nome: "ProteçÍo de hall e áreas comuns",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Lona, Fita adesiva, Plástico bolha"
            }
          },
          {
            id: "pre-esquadrias",
            nome: "ProteçÍo de esquadrias e vidros existentes",
            tempoEstimadoMinutos: 40,
            recursos: {
              insumo: "Fita crepe, Plástico filme"
            }
          },
          {
            id: "pre-moveis",
            nome: "ProteçÍo de móveis que permanecem",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Plástico bolha, Cobertor de mudança, Filme stretch"
            }
          }
        ]
      },
      {
        id: "pre-logistica",
        nome: "Logística e SinalizaçÍo",
        descricao: "SinalizaçÍo de obra, canteiro e reserva de vaga.",
        tasks: [
          {
            id: "pre-sinalizacao",
            nome: "SinalizaçÍo de segurança",
            tempoEstimadoMinutos: 20,
            recursos: {
              insumo: "Placas de sinalizaçÍo NR-18, Fita zebrada"
            }
          },
          {
            id: "pre-canteiro",
            nome: "Montagem do canteiro (banheiro, depósito)",
            tempoEstimadoMinutos: 60,
            recursos: {
              infra: "Container / área reservada, Prateleiras"
            }
          },
          {
            id: "pre-cacamba",
            nome: "Posicionamento de caçamba de entulho",
            tempoEstimadoMinutos: 15,
            recursos: {
              infra: "Caçamba 4m³, Lona de cobertura"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Demolições (3 fases)
  // ============================================================
  demolicoes: {
    ...baseFlow,
    id: "demolicoes",
    nome: "Demolições — RemoçÍo Controlada",
    descricao: "Fluxo de demoliçÍo controlada: remoçÍo de revestimentos, alvenaria e destinaçÍo de entulho. Ref: NR-18.",
    fases: [
      {
        id: "dem-remocao-acabamento",
        nome: "RemoçÍo de Acabamentos",
        descricao: "RemoçÍo de revestimentos, forros e pisos existentes.",
        tasks: [
          {
            id: "dem-forro",
            nome: "RemoçÍo de forro (gesso/PVC)",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Pé de cabra, Espátula larga",
              epi: "Capacete + Óculos + Máscara + Luvas"
            }
          },
          {
            id: "dem-revestimento",
            nome: "RemoçÍo de revestimento de parede (azulejo/cerâmica)",
            tempoEstimadoMinutos: 180,
            recursos: {
              ferramenta: "Martelete, Ponteiro, Talhadeira",
              epi: "Capacete + Óculos + Máscara + Luvas"
            }
          },
          {
            id: "dem-piso",
            nome: "RemoçÍo de piso (cerâmica/porcelanato)",
            tempoEstimadoMinutos: 240,
            recursos: {
              ferramenta: "Martelete, Rompedor elétrico",
              epi: "Capacete + Óculos + Máscara + Luvas + Botina"
            }
          },
          {
            id: "dem-rodape",
            nome: "RemoçÍo de rodapé e soleiras",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Espátula, Talhadeira, Martelo"
            }
          }
        ]
      },
      {
        id: "dem-alvenaria",
        nome: "DemoliçÍo de Alvenaria",
        descricao: "DemoliçÍo de paredes e aberturas de vÍos.",
        tasks: [
          {
            id: "dem-marcacao",
            nome: "MarcaçÍo e corte de parede",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Makita com disco diamantado",
              epi: "Capacete + Óculos + Máscara + Protetor auricular"
            }
          },
          {
            id: "dem-parede",
            nome: "DemoliçÍo de parede",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Martelete, Rompedor, Ponteiro",
              epi: "Capacete + Óculos + Máscara + Luvas + Botina"
            }
          },
          {
            id: "dem-vao",
            nome: "Abertura de vÍo (porta/janela)",
            tempoEstimadoMinutos: 90,
            recursos: {
              ferramenta: "Martelete, Makita",
              infra: "Verga/contraverga metálica (se estrutural)"
            }
          }
        ]
      },
      {
        id: "dem-descarte",
        nome: "Descarte e Limpeza",
        descricao: "Ensacamento, transporte e destinaçÍo de entulho.",
        tasks: [
          {
            id: "dem-ensacar",
            nome: "Ensacar entulho",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Sacos de ráfia 60L, Pá, Carrinho de mÍo",
              epi: "Luvas + Máscara"
            }
          },
          {
            id: "dem-transporte",
            nome: "Transporte até caçamba",
            tempoEstimadoMinutos: 45,
            recursos: {
              ferramenta: "Carrinho de mÍo, Giricas",
              infra: "Caçamba de entulho 4m³"
            }
          },
          {
            id: "dem-limpeza-grossa",
            nome: "Limpeza grossa do local",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Vassoura, Pá, Rodo",
              insumo: "Sacos de lixo reforçados"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Içamento (2 fases)
  // ============================================================
  icamento: {
    ...baseFlow,
    id: "icamento",
    nome: "Içamento — Transporte Vertical de Materiais",
    descricao: "Fluxo de içamento de materiais pesados e volumosos para andares superiores.",
    fases: [
      {
        id: "ica-planejamento",
        nome: "Planejamento e Logística",
        descricao: "AvaliaçÍo de carga, agendamento e preparaçÍo.",
        tasks: [
          {
            id: "ica-avaliacao",
            nome: "AvaliaçÍo de peso e volume da carga",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Balança, Trena"
            }
          },
          {
            id: "ica-agendamento",
            nome: "Agendamento com condomínio/prefeitura",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Formulário de autorizaçÍo"
            }
          },
          {
            id: "ica-protecao-fachada",
            nome: "ProteçÍo de fachada e marquise",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Lona, Compensado de proteçÍo, Fita zebrada"
            }
          }
        ]
      },
      {
        id: "ica-execucao",
        nome: "ExecuçÍo do Içamento",
        descricao: "OperaçÍo do munck, movimentaçÍo e posicionamento de cargas.",
        tasks: [
          {
            id: "ica-munck",
            nome: "OperaçÍo de munck / guindaste",
            tempoEstimadoMinutos: 180,
            recursos: {
              ferramenta: "Munck / Guindaste articulado",
              epi: "Capacete + Cinto + Luvas"
            }
          },
          {
            id: "ica-amarracao",
            nome: "AmarraçÍo e cintas de segurança",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Cintas de içamento, Manilhas, Mosquetões",
              epi: "Capacete + Luvas"
            }
          },
          {
            id: "ica-recepcao",
            nome: "RecepçÍo e posicionamento no andar",
            tempoEstimadoMinutos: 60,
            recursos: {
              epi: "Capacete + Luvas + Cinto (se borda)"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Alvenaria (3 fases)
  // ============================================================
  alvenaria: {
    ...baseFlow,
    id: "alvenaria",
    nome: "Alvenaria — Levantamento e Revestimento",
    descricao: "Fluxo de execuçÍo de alvenaria: marcaçÍo, levante, chapisco e reboco. Referências: SINAPI, NBR 8545.",
    fases: [
      {
        id: "alv-marcacao",
        nome: "MarcaçÍo e Levante",
        descricao: "MarcaçÍo de paredes e levantamento de alvenaria.",
        tasks: [
          {
            id: "alv-marcacao-piso",
            nome: "MarcaçÍo de paredes no piso",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Nível laser, Trena, Linha de pedreiro",
              insumo: "Giz de marcaçÍo"
            }
          },
          {
            id: "alv-levante",
            nome: "Levante de alvenaria (bloco/tijolo)",
            tempoEstimadoMinutos: 480,
            recursos: {
              insumo: "Bloco cerâmico 14x19x29cm, Argamassa de assentamento",
              ferramenta: "Colher de pedreiro, Nível, Prumo"
            }
          },
          {
            id: "alv-verga",
            nome: "ExecuçÍo de vergas e contravergas",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "VergalhÍo CA-50, Concreto, Forma de madeira",
              ferramenta: "Torquês, Serrote"
            }
          },
          {
            id: "alv-tela",
            nome: "Tela de ancoragem (pilar/parede)",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Tela galvanizada, Pinos de aço"
            }
          }
        ]
      },
      {
        id: "alv-revestimento",
        nome: "Chapisco e Reboco",
        descricao: "Chapisco, emboço e reboco das paredes.",
        tasks: [
          {
            id: "alv-chapisco",
            nome: "Chapisco rolado/desempenado",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Chapisco rolado Quartzolit, Rolo de lÍ",
              ferramenta: "Rolo para chapisco, Caçamba"
            }
          },
          {
            id: "alv-taliscas",
            nome: "Taliscas e mestras",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Argamassa, Pregos",
              ferramenta: "Nível laser, Régua de alumínio"
            }
          },
          {
            id: "alv-reboco",
            nome: "Reboco / Emboço",
            tempoEstimadoMinutos: 360,
            recursos: {
              insumo: "Argamassa de reboco, Água",
              ferramenta: "Desempenadeira, Régua 2m, Colher de pedreiro"
            }
          }
        ]
      },
      {
        id: "alv-acabamento",
        nome: "Acabamento",
        descricao: "Requadros, cantos e arremates.",
        tasks: [
          {
            id: "alv-requadro",
            nome: "Requadro de portas e janelas",
            tempoEstimadoMinutos: 90,
            recursos: {
              insumo: "Argamassa, Cantoneira de alumínio",
              ferramenta: "Desempenadeira, Espátula"
            }
          },
          {
            id: "alv-cantoneira",
            nome: "Cantoneiras de proteçÍo de quinas",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Cantoneira PVC/alumínio, Argamassa"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Material Básico (2 fases)
  // ============================================================
  materialBasico: {
    ...baseFlow,
    id: "material-basico",
    nome: "Material Básico — Insumos de Obra",
    descricao: "Fluxo de compra, recebimento e controle de materiais básicos de construçÍo.",
    fases: [
      {
        id: "mb-compra",
        nome: "Compra e Entrega",
        descricao: "CotaçÍo, compra e recebimento de materiais básicos.",
        tasks: [
          {
            id: "mb-cotacao",
            nome: "CotaçÍo de materiais",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Telefone, Sistema WG, Planilha"
            }
          },
          {
            id: "mb-entrega",
            nome: "Recebimento e conferência",
            tempoEstimadoMinutos: 45,
            recursos: {
              ferramenta: "Nota fiscal, Balança"
            }
          }
        ]
      },
      {
        id: "mb-materiais",
        nome: "Lista de Materiais",
        descricao: "Materiais básicos padrÍo para obra de reforma.",
        tasks: [
          {
            id: "mb-cimento",
            nome: "Cimento CP-II e CP-V",
            recursos: {
              insumo: "Cimento 50kg (CP-II/CP-V ARI)"
            }
          },
          {
            id: "mb-areia",
            nome: "Areia média e grossa",
            recursos: {
              insumo: "Areia média lavada (m³)"
            }
          },
          {
            id: "mb-pedra",
            nome: "Pedra brita (se necessário)",
            recursos: {
              insumo: "Brita 1, Brita 0 (pedrisco)"
            }
          },
          {
            id: "mb-argamassa",
            nome: "Argamassa pronta (AC-I, AC-II, AC-III)",
            recursos: {
              insumo: "Argamassa colante AC-II 20kg, Argamassa de reboco 20kg"
            }
          },
          {
            id: "mb-cal",
            nome: "Cal hidratada",
            recursos: {
              insumo: "Cal hidratada 20kg"
            }
          },
          {
            id: "mb-aditivos",
            nome: "Aditivos e impermeabilizantes",
            recursos: {
              insumo: "Vedacit, Sika, Bianco"
            }
          },
          {
            id: "mb-agua",
            nome: "Água para obra",
            recursos: {
              infra: "Ponto de água, Mangueira, Balde"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Drywall (3 fases)
  // ============================================================
  drywall: {
    ...baseFlow,
    id: "drywall",
    nome: "Drywall — Paredes e Forros",
    descricao: "Fluxo de execuçÍo de drywall: estrutura metálica, fechamento com placas e tratamento de juntas. Ref: Placo/Knauf.",
    fases: [
      {
        id: "dry-estrutura",
        nome: "Estrutura Metálica",
        descricao: "Montagem da estrutura de perfis metálicos (guias e montantes).",
        tasks: [
          {
            id: "dry-marcacao",
            nome: "MarcaçÍo no piso e teto",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Nível laser, Trena, Linha de giz",
              epi: "Óculos + Luvas"
            }
          },
          {
            id: "dry-guias",
            nome: "FixaçÍo de guias (piso e teto)",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Guia 48mm/70mm/90mm, Fita acústica, Parafuso + bucha",
              ferramenta: "Furadeira, Alicate de punçÍo"
            }
          },
          {
            id: "dry-montantes",
            nome: "InstalaçÍo de montantes",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Montante 48mm/70mm/90mm, Parafuso ponta broca",
              ferramenta: "Parafusadeira, Alicate de pressÍo"
            }
          },
          {
            id: "dry-reforco",
            nome: "Reforço para TV/prateleira (Dry-Box)",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Montante duplo, Chapa de reforço, Parafusos"
            }
          }
        ]
      },
      {
        id: "dry-fechamento",
        nome: "Fechamento com Placas",
        descricao: "InstalaçÍo das placas de gesso acartonado.",
        tasks: [
          {
            id: "dry-placa-1face",
            nome: "Fechamento 1ª face",
            tempoEstimadoMinutos: 90,
            recursos: {
              insumo: "Placa ST 12.5mm (ou RU para área úmida)",
              ferramenta: "Parafusadeira, Estilete"
            }
          },
          {
            id: "dry-isolamento",
            nome: "InstalaçÍo de lÍ mineral (acústico/térmico)",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "LÍ de rocha/vidro 50mm",
              epi: "Máscara + Luvas + Manga longa"
            }
          },
          {
            id: "dry-placa-2face",
            nome: "Fechamento 2ª face",
            tempoEstimadoMinutos: 90,
            recursos: {
              insumo: "Placa ST 12.5mm, Parafuso drywall 25mm",
              ferramenta: "Parafusadeira"
            }
          }
        ]
      },
      {
        id: "dry-tratamento",
        nome: "Tratamento de Juntas",
        descricao: "Fita, massa e lixamento para superfície pronta para pintura.",
        tasks: [
          {
            id: "dry-fita-junta",
            nome: "AplicaçÍo de fita e 1ª demÍo de massa",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Fita de papel microperfurada, Massa para junta",
              ferramenta: "Espátula 15cm/25cm"
            }
          },
          {
            id: "dry-massa-2",
            nome: "2ª e 3ª demÍo de massa",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Massa para junta Placo/Knauf",
              ferramenta: "Espátula 25cm/30cm"
            }
          },
          {
            id: "dry-lixar",
            nome: "Lixamento fino",
            tempoEstimadoMinutos: 40,
            recursos: {
              insumo: "Lixa 150/180",
              ferramenta: "Lixadeira orbital, Suporte para lixa",
              epi: "Máscara + Óculos"
            }
          },
          {
            id: "dry-cantoneira",
            nome: "Cantoneira de quina",
            tempoEstimadoMinutos: 20,
            recursos: {
              insumo: "Cantoneira metálica Knauf, Massa"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Gás (2 fases)
  // ============================================================
  gas: {
    ...baseFlow,
    id: "gas",
    nome: "Gás — InstalaçÍo de TubulaçÍo",
    descricao: "Fluxo de instalaçÍo de gás GLP/GN: tubulaçÍo, registros e teste de estanqueidade. Ref: NBR 15526.",
    fases: [
      {
        id: "gas-infra",
        nome: "Infraestrutura",
        descricao: "TubulaçÍo, registros e conexões.",
        tasks: [
          {
            id: "gas-rasgo",
            nome: "Rasgo na alvenaria para tubulaçÍo",
            tempoEstimadoMinutos: 45,
            recursos: {
              ferramenta: "Makita / Martelete",
              epi: "Óculos + Luvas + Máscara"
            }
          },
          {
            id: "gas-tubo",
            nome: "InstalaçÍo de tubulaçÍo de cobre/aço",
            tempoEstimadoMinutos: 90,
            recursos: {
              insumo: "Tubo de cobre 15mm/22mm (gás), Conexões de cobre (soldáveis)",
              ferramenta: "Maçarico, Solda prata, Fluxo"
            }
          },
          {
            id: "gas-registro",
            nome: "InstalaçÍo de registros de gás",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Registro esfera para gás, Abrigo para medidor"
            }
          },
          {
            id: "gas-fechar",
            nome: "Fechamento de rasgos",
            tempoEstimadoMinutos: 30,
            recursos: {
              infra: "Argamassa / Gesso"
            }
          }
        ]
      },
      {
        id: "gas-teste",
        nome: "Teste e CertificaçÍo",
        descricao: "Teste de estanqueidade e certificaçÍo da instalaçÍo.",
        tasks: [
          {
            id: "gas-estanqueidade",
            nome: "Teste de estanqueidade com nitrogênio",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Manômetro, Cilindro de nitrogênio",
              insumo: "Espuma de detecçÍo de vazamento"
            }
          },
          {
            id: "gas-laudo",
            nome: "EmissÍo de laudo técnico",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Formulário padrÍo, ART/RRT"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Aquecedor a Gás (2 fases)
  // ============================================================
  aquecedorGas: {
    ...baseFlow,
    id: "aquecedor-gas",
    nome: "Aquecedor a Gás — InstalaçÍo Completa",
    descricao: "Fluxo de instalaçÍo de aquecedor a gás: infraestrutura, instalaçÍo do equipamento e teste.",
    fases: [
      {
        id: "aqg-infra",
        nome: "Infraestrutura",
        descricao: "Ponto de gás, água e exaustÍo.",
        tasks: [
          {
            id: "aqg-ponto-gas",
            nome: "Ponto de gás dedicado",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Tubo cobre 22mm, Registro esfera gás",
              ferramenta: "Maçarico, Solda prata"
            }
          },
          {
            id: "aqg-agua",
            nome: "Ponto de água fria e saída de água quente",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Tubo CPVC/PPR, Conexões, Registro"
            }
          },
          {
            id: "aqg-chamine",
            nome: "InstalaçÍo de chaminé/exaustÍo",
            tempoEstimadoMinutos: 40,
            recursos: {
              insumo: "Duto de alumínio 80/100mm, Abraçadeiras, Terminal de parede"
            }
          }
        ]
      },
      {
        id: "aqg-instalacao",
        nome: "InstalaçÍo e Teste",
        descricao: "FixaçÍo do aquecedor e teste de funcionamento.",
        tasks: [
          {
            id: "aqg-fixacao",
            nome: "FixaçÍo do aquecedor na parede",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Aquecedor a gás (15L/20L/25L)",
              ferramenta: "Furadeira, Nível, Parafusos + Buchas"
            }
          },
          {
            id: "aqg-conexao",
            nome: "ConexÍo de gás e água",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Flexível para gás, Fita veda-rosca"
            }
          },
          {
            id: "aqg-teste",
            nome: "Teste de vazamento e funcionamento",
            tempoEstimadoMinutos: 20,
            recursos: {
              ferramenta: "Termômetro, Espuma de detecçÍo"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Gesso (3 fases)
  // ============================================================
  gesso: {
    ...baseFlow,
    id: "gesso",
    nome: "Gesso — Forro e Molduras",
    descricao: "Fluxo de instalaçÍo de forro de gesso: estrutura, placas/molduras e acabamento. Ref: SINAPI.",
    fases: [
      {
        id: "ges-estrutura",
        nome: "Estrutura e FixaçÍo",
        descricao: "MarcaçÍo, pendurais e estrutura de sustentaçÍo do forro.",
        tasks: [
          {
            id: "ges-nivel",
            nome: "MarcaçÍo de nível do forro",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Nível laser, Linha de giz"
            }
          },
          {
            id: "ges-pendurais",
            nome: "InstalaçÍo de pendurais / tirantes",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Arame galvanizado, Pinos de aço, Bucha + Parafuso",
              ferramenta: "Furadeira, Alicate"
            }
          },
          {
            id: "ges-perfil",
            nome: "Perfis de sustentaçÍo (forro estruturado)",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Perfil canaleta, Perfil F, Emendas"
            }
          }
        ]
      },
      {
        id: "ges-execucao",
        nome: "ExecuçÍo do Forro",
        descricao: "InstalaçÍo das placas de gesso e molduras/sancas.",
        tasks: [
          {
            id: "ges-placa",
            nome: "InstalaçÍo de placas de gesso (liso/acartonado)",
            tempoEstimadoMinutos: 180,
            recursos: {
              insumo: "Placa de gesso 60x60cm, Massa de gesso",
              ferramenta: "Espátula, Desempenadeira"
            }
          },
          {
            id: "ges-sanca",
            nome: "ExecuçÍo de sanca (aberta/fechada/invertida)",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Placa de gesso, Massa, Fita de papel",
              ferramenta: "Serrote para gesso, Espátula"
            }
          },
          {
            id: "ges-moldura",
            nome: "Moldura de gesso decorativa",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Moldura de gesso (perfil escolhido), Massa de colagem"
            }
          },
          {
            id: "ges-recorte-spots",
            nome: "Recortes para spots e luminárias",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Serra copo, Furadeira"
            }
          }
        ]
      },
      {
        id: "ges-acabamento",
        nome: "Acabamento",
        descricao: "Tratamento de juntas, lixamento e preparaçÍo para pintura.",
        tasks: [
          {
            id: "ges-junta",
            nome: "Tratamento de juntas e emendas",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Massa de gesso, Fita microperfurada",
              ferramenta: "Espátula 15cm/25cm"
            }
          },
          {
            id: "ges-lixar",
            nome: "Lixamento fino",
            tempoEstimadoMinutos: 40,
            recursos: {
              insumo: "Lixa 150/180 para gesso",
              epi: "Máscara + Óculos"
            }
          },
          {
            id: "ges-selador",
            nome: "AplicaçÍo de selador",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Selador acrílico para gesso",
              ferramenta: "Rolo de lÍ, Trincha"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Piso (3 fases)
  // ============================================================
  piso: {
    ...baseFlow,
    id: "piso",
    nome: "Piso — Assentamento e Rejunte",
    descricao: "Fluxo de assentamento de piso cerâmico/porcelanato: preparaçÍo, assentamento e rejunte. Ref: SINAPI.",
    fases: [
      {
        id: "pis-preparacao",
        nome: "PreparaçÍo do Contrapiso",
        descricao: "RegularizaçÍo do contrapiso e impermeabilizaçÍo (áreas molhadas).",
        tasks: [
          {
            id: "pis-nivelamento",
            nome: "Nivelamento e regularizaçÍo do contrapiso",
            tempoEstimadoMinutos: 240,
            recursos: {
              insumo: "Argamassa de contrapiso, Nível a laser",
              ferramenta: "Régua de alumínio 2m, Desempenadeira"
            }
          },
          {
            id: "pis-imperm",
            nome: "ImpermeabilizaçÍo (áreas molhadas)",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Manta asfáltica / Vedapren, Primer asfáltico",
              ferramenta: "Maçarico (manta), Rolo (líquida)"
            }
          },
          {
            id: "pis-mestras",
            nome: "Mestras de referência de nível",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Argamassa, Espaçadores",
              ferramenta: "Nível laser, Régua"
            }
          }
        ]
      },
      {
        id: "pis-assentamento",
        nome: "Assentamento",
        descricao: "Assentamento de porcelanato/cerâmica com argamassa colante.",
        tasks: [
          {
            id: "pis-corte",
            nome: "Corte de peças (riscador/serra)",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Cortadora de piso elétrica, Riscador manual",
              epi: "Óculos + Luvas + Protetor auricular"
            }
          },
          {
            id: "pis-assentar",
            nome: "Assentamento com dupla colagem",
            tempoEstimadoMinutos: 480,
            recursos: {
              insumo: "Argamassa AC-II/AC-III, Espaçadores 2mm/3mm",
              ferramenta: "Desempenadeira dentada, Martelo de borracha, Nível"
            }
          },
          {
            id: "pis-recorte",
            nome: "Recortes especiais (ralos, colunas, soleiras)",
            tempoEstimadoMinutos: 90,
            recursos: {
              ferramenta: "Serra mármore, Serra copo diamantada"
            }
          }
        ]
      },
      {
        id: "pis-rejunte",
        nome: "Rejunte e Limpeza",
        descricao: "Rejunte, limpeza de resíduos e proteçÍo do piso.",
        tasks: [
          {
            id: "pis-rejuntar",
            nome: "AplicaçÍo de rejunte",
            tempoEstimadoMinutos: 180,
            recursos: {
              insumo: "Rejunte Quartzolit/Portokoll (cor especificada)",
              ferramenta: "Desempenadeira de borracha, Esponja"
            }
          },
          {
            id: "pis-limpeza",
            nome: "Limpeza de resíduos de rejunte",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Ácido muriático diluído (se cerâmica), Pano úmido",
              epi: "Luvas + Máscara"
            }
          },
          {
            id: "pis-protecao",
            nome: "ProteçÍo do piso instalado",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "PapelÍo ondulado, Fita crepe"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Material de Pintura (2 fases)
  // ============================================================
  materialPintura: {
    ...baseFlow,
    id: "material-pintura",
    nome: "Material de Pintura — Insumos e Produtos",
    descricao: "Fluxo de compra e aplicaçÍo dos materiais de pintura: massas, seladores, tintas e texturas.",
    fases: [
      {
        id: "mpt-preparacao",
        nome: "Materiais de PreparaçÍo",
        descricao: "Insumos para preparar superfícies antes da pintura.",
        tasks: [
          {
            id: "mpt-massa-corrida",
            nome: "Massa corrida / Massa acrílica",
            recursos: {
              insumo: "Massa corrida PVA (interior) / Acrílica (exterior) - lata 18L"
            }
          },
          {
            id: "mpt-selador",
            nome: "Selador acrílico",
            recursos: {
              insumo: "Selador acrílico 18L"
            }
          },
          {
            id: "mpt-lixa",
            nome: "Lixas (diversas gramaturas)",
            recursos: {
              insumo: "Lixa 100/150/220 para massa, Lixa d'água 400"
            }
          },
          {
            id: "mpt-fita",
            nome: "Fita crepe e plásticos de proteçÍo",
            recursos: {
              insumo: "Fita crepe 24mm/48mm, Lona plástica"
            }
          }
        ]
      },
      {
        id: "mpt-tintas",
        nome: "Tintas e Acabamento",
        descricao: "Tintas, vernizes e texturas de acabamento.",
        tasks: [
          {
            id: "mpt-tinta-parede",
            nome: "Tinta acrílica para paredes",
            recursos: {
              produto: "Tinta acrílica acetinada/fosca 18L (Suvinil/Coral)"
            }
          },
          {
            id: "mpt-tinta-teto",
            nome: "Tinta para teto",
            recursos: {
              produto: "Tinta acrílica branco fosco 18L"
            }
          },
          {
            id: "mpt-esmalte",
            nome: "Esmalte sintético (portas/janelas)",
            recursos: {
              produto: "Esmalte sintético 3.6L, Thinner"
            }
          },
          {
            id: "mpt-verniz",
            nome: "Verniz e stain (madeiras)",
            recursos: {
              produto: "Verniz marítimo / Stain (se aplicável)"
            }
          },
          {
            id: "mpt-ferramentas",
            nome: "Ferramentas de pintura",
            recursos: {
              ferramenta: "Rolo de lÍ 23cm, Trincha 2\"/3\", Bandeja, Cabo extensor"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Marmoraria (3 fases)
  // ============================================================
  marmoraria: {
    ...baseFlow,
    id: "marmoraria",
    nome: "Marmoraria — Pedras Naturais e Engineered Stone",
    descricao: "Fluxo de marmoraria: mediçÍo, fabricaçÍo, instalaçÍo e polimento. Ref: granitos, mármores, quartzo, Silestone, Dekton.",
    fases: [
      {
        id: "mar-medicao",
        nome: "MediçÍo e Projeto",
        descricao: "MediçÍo in loco e projeto de corte das peças.",
        tasks: [
          {
            id: "mar-visita",
            nome: "Visita técnica e mediçÍo",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Trena, Nível, Gabarito de papelÍo"
            }
          },
          {
            id: "mar-projeto",
            nome: "Projeto de corte e otimizaçÍo de chapa",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "AutoCAD / Software de corte"
            }
          },
          {
            id: "mar-selecao",
            nome: "SeleçÍo de chapas na marmoraria",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Fotos de referência do cliente"
            }
          }
        ]
      },
      {
        id: "mar-fabricacao",
        nome: "FabricaçÍo na Marmoraria",
        descricao: "Corte, acabamento de bordas e polimento em fábrica.",
        tasks: [
          {
            id: "mar-corte",
            nome: "Corte das peças (bancadas, soleiras, pingadeiras)",
            tempoEstimadoMinutos: 180,
            recursos: {
              ferramenta: "Serra ponte CNC, Disco diamantado"
            }
          },
          {
            id: "mar-borda",
            nome: "Acabamento de bordas (meia-cana, reto, chanfro)",
            tempoEstimadoMinutos: 90,
            recursos: {
              ferramenta: "Politriz, Fresas diamantadas"
            }
          },
          {
            id: "mar-furos",
            nome: "Furos para cuba, torneira e cooktop",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Serra copo diamantada, Furadeira"
            }
          }
        ]
      },
      {
        id: "mar-instalacao",
        nome: "InstalaçÍo e Polimento",
        descricao: "Transporte, instalaçÍo e acabamento final no local.",
        tasks: [
          {
            id: "mar-transporte",
            nome: "Transporte e içamento das peças",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Ventosas, Cavalete de transporte",
              epi: "Luvas + Botina"
            }
          },
          {
            id: "mar-assentar",
            nome: "Assentamento com massa epóxi",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Massa epóxi, Silicone estrutural, Calços",
              ferramenta: "Nível, Ventosas"
            }
          },
          {
            id: "mar-rejunte-silicone",
            nome: "Rejunte e silicone de acabamento",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Silicone neutro (cor da pedra), Fita crepe"
            }
          },
          {
            id: "mar-polimento",
            nome: "Polimento e impermeabilizaçÍo",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Impermeabilizante para pedra, Cera cristalizadora",
              ferramenta: "Politriz, Lixas diamantadas"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: AutomaçÍo (3 fases)
  // ============================================================
  automacao: {
    ...baseFlow,
    id: "automacao",
    nome: "AutomaçÍo Residencial — Smart Home",
    descricao: "Fluxo de automaçÍo: infraestrutura de cabeamento, central de automaçÍo e programaçÍo de cenas.",
    fases: [
      {
        id: "aut-infra",
        nome: "Infraestrutura",
        descricao: "Cabeamento estruturado e pontos de rede/automaçÍo.",
        tasks: [
          {
            id: "aut-eletroduto",
            nome: "Passagem de eletroduto dedicado",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Eletroduto corrugado 3/4\", Caixas de passagem"
            }
          },
          {
            id: "aut-cabo-rede",
            nome: "Cabeamento de rede (Cat6/Cat6a)",
            tempoEstimadoMinutos: 90,
            recursos: {
              insumo: "Cabo UTP Cat6 (caixa 305m), Conectores RJ45, Patch panel"
            }
          },
          {
            id: "aut-cabo-controle",
            nome: "Cabeamento de controle (bus/KNX/RS485)",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Cabo bus 2 pares, Cabo HDMI 2.1, Cabo IR"
            }
          }
        ]
      },
      {
        id: "aut-central",
        nome: "Central e Equipamentos",
        descricao: "InstalaçÍo da central de automaçÍo e periféricos.",
        tasks: [
          {
            id: "aut-rack",
            nome: "Montagem do rack de automaçÍo",
            tempoEstimadoMinutos: 60,
            recursos: {
              produto: "Rack 8U/12U, Régua de tomadas, Patch panel, Switch"
            }
          },
          {
            id: "aut-central",
            nome: "InstalaçÍo da central de automaçÍo",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Central de automaçÍo (Savant/Control4/Alexa/Home Assistant)"
            }
          },
          {
            id: "aut-atuadores",
            nome: "InstalaçÍo de atuadores e módulos",
            tempoEstimadoMinutos: 60,
            recursos: {
              produto: "Módulos relé, Dimmer inteligente, Módulo de persiana"
            }
          },
          {
            id: "aut-sensores",
            nome: "InstalaçÍo de sensores",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Sensor de presença, Sensor de abertura, Sensor de luminosidade"
            }
          }
        ]
      },
      {
        id: "aut-programacao",
        nome: "ProgramaçÍo e Cenas",
        descricao: "ConfiguraçÍo de cenas, rotinas e integraçÍo com assistentes.",
        tasks: [
          {
            id: "aut-config",
            nome: "ProgramaçÍo de cenas e rotinas",
            tempoEstimadoMinutos: 180,
            recursos: {
              ferramenta: "Software de programaçÍo, Tablet/notebook"
            }
          },
          {
            id: "aut-voz",
            nome: "IntegraçÍo com assistentes de voz",
            tempoEstimadoMinutos: 60,
            recursos: {
              produto: "Echo Dot/Google Home/HomePod"
            }
          },
          {
            id: "aut-teste",
            nome: "Teste de todos os cenários",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "App de controle, Tablet dedicado"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Cubas, Louças e Metais (2 fases)
  // ============================================================
  cubasLoucasMetais: {
    ...baseFlow,
    id: "cubas-loucas-metais",
    nome: "Cubas, Louças e Metais — InstalaçÍo Completa",
    descricao: "Fluxo de instalaçÍo de cubas, vasos, bidês, torneiras e acessórios. Ref: Deca, Docol, Roca.",
    fases: [
      {
        id: "clm-fixacao",
        nome: "FixaçÍo e Montagem",
        descricao: "FixaçÍo de louças na parede e bancada.",
        tasks: [
          {
            id: "clm-vaso",
            nome: "InstalaçÍo de vaso sanitário (caixa acoplada/embutida)",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Vaso sanitário + Caixa acoplada",
              insumo: "Parafusos de fixaçÍo, Anel de vedaçÍo, Silicone",
              ferramenta: "Furadeira, Nível, Chave de boca"
            }
          },
          {
            id: "clm-cuba-bancada",
            nome: "InstalaçÍo de cuba de embutir/apoio",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Cuba de embutir/apoio",
              insumo: "Silicone neutro, SifÍo, Flexível",
              ferramenta: "Furadeira (se apoio)"
            }
          },
          {
            id: "clm-cuba-parede",
            nome: "InstalaçÍo de cuba de parede / lavatório",
            tempoEstimadoMinutos: 40,
            recursos: {
              produto: "Lavatório de coluna / Parede",
              insumo: "Parafusos + Buchas, Silicone",
              ferramenta: "Furadeira, Nível"
            }
          },
          {
            id: "clm-bide",
            nome: "InstalaçÍo de bidê (se aplicável)",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Bidê",
              insumo: "Parafusos, Flexível, SifÍo"
            }
          }
        ]
      },
      {
        id: "clm-metais",
        nome: "Metais e Acessórios",
        descricao: "InstalaçÍo de torneiras, misturadores, chuveiros e acessórios.",
        tasks: [
          {
            id: "clm-torneira",
            nome: "InstalaçÍo de torneiras e misturadores",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Torneira de bancada / Misturador monocomando",
              insumo: "Flexível, Fita veda-rosca"
            }
          },
          {
            id: "clm-chuveiro",
            nome: "InstalaçÍo de chuveiro/ducha",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Chuveiro / Ducha higiênica",
              insumo: "Fita veda-rosca, Bucha de reduçÍo"
            }
          },
          {
            id: "clm-acessorios",
            nome: "InstalaçÍo de acessórios (papeleira, saboneteira, cabide)",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Kit acessórios (papeleira, saboneteira, cabide, toalheiro)",
              ferramenta: "Furadeira, Nível"
            }
          },
          {
            id: "clm-teste",
            nome: "Teste de funcionamento e vazamentos",
            tempoEstimadoMinutos: 15,
            recursos: {
              ferramenta: "Chave de boca (ajustes)"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Envidraçamento (3 fases)
  // ============================================================
  envidracamento: {
    ...baseFlow,
    id: "envidracamento",
    nome: "Envidraçamento — Fechamento de Varandas e Sacadas",
    descricao: "Fluxo de envidraçamento: mediçÍo, fabricaçÍo e instalaçÍo de esquadrias de vidro.",
    fases: [
      {
        id: "env-medicao",
        nome: "MediçÍo e Projeto",
        descricao: "MediçÍo técnica e projeto de fabricaçÍo.",
        tasks: [
          {
            id: "env-visita",
            nome: "Visita técnica e mediçÍo",
            tempoEstimadoMinutos: 90,
            recursos: {
              ferramenta: "Trena laser, Nível, Gabarito"
            }
          },
          {
            id: "env-projeto",
            nome: "Projeto de fabricaçÍo e aprovaçÍo",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "AutoCAD / Software de esquadrias"
            }
          }
        ]
      },
      {
        id: "env-fabricacao",
        nome: "FabricaçÍo",
        descricao: "FabricaçÍo das esquadrias e vidros temperados.",
        tasks: [
          {
            id: "env-aluminio",
            nome: "Corte e montagem de perfis de alumínio",
            tempoEstimadoMinutos: 240,
            recursos: {
              insumo: "Perfis de alumínio (série 25/linha Gold), Parafusos, Roldanas"
            }
          },
          {
            id: "env-vidro",
            nome: "Corte e têmpera do vidro",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Vidro temperado 8mm/10mm"
            }
          }
        ]
      },
      {
        id: "env-instalacao",
        nome: "InstalaçÍo",
        descricao: "InstalaçÍo no local, vedaçÍo e regulagem.",
        tasks: [
          {
            id: "env-chumbamento",
            nome: "Chumbamento de trilhos/guias",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Furadeira, Nível laser",
              insumo: "Bucha + Parafuso, Silicone estrutural"
            }
          },
          {
            id: "env-montagem",
            nome: "Montagem das folhas de vidro",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Ventosas, Chave Allen",
              epi: "Luvas + Óculos"
            }
          },
          {
            id: "env-vedacao",
            nome: "VedaçÍo e calafetaçÍo",
            tempoEstimadoMinutos: 40,
            recursos: {
              insumo: "Silicone neutro, Borracha de vedaçÍo, Escova de vedaçÍo"
            }
          },
          {
            id: "env-regulagem",
            nome: "Regulagem e teste de deslizamento",
            tempoEstimadoMinutos: 20,
            recursos: {
              ferramenta: "Chave Allen, Spray lubrificante"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: IluminaçÍo (3 fases)
  // ============================================================
  iluminacao: {
    ...baseFlow,
    id: "iluminacao",
    nome: "IluminaçÍo — Projeto Luminotécnico",
    descricao: "Fluxo de iluminaçÍo: projeto luminotécnico, instalaçÍo de luminárias e programaçÍo de cenas.",
    fases: [
      {
        id: "ilu-projeto",
        nome: "Projeto Luminotécnico",
        descricao: "Estudo de iluminaçÍo e definiçÍo de luminárias.",
        tasks: [
          {
            id: "ilu-estudo",
            nome: "Estudo de iluminância (lux por ambiente)",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "DIALux / Relux, Planta do projeto"
            }
          },
          {
            id: "ilu-especificacao",
            nome: "EspecificaçÍo de luminárias e lâmpadas",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Catálogos (Lumini, Interlight, Brilia, Stella)"
            }
          }
        ]
      },
      {
        id: "ilu-instalacao",
        nome: "InstalaçÍo",
        descricao: "InstalaçÍo de luminárias, spots e fitas LED.",
        tasks: [
          {
            id: "ilu-spot",
            nome: "InstalaçÍo de spots embutidos",
            tempoEstimadoMinutos: 15,
            recursos: {
              produto: "Spot LED embutir (5W/7W/10W), Lâmpada MR16/GU10",
              ferramenta: "Serra copo, Chave de fenda"
            }
          },
          {
            id: "ilu-pendente",
            nome: "InstalaçÍo de pendentes e plafons",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Pendente / Plafon (modelo especificado)",
              ferramenta: "Furadeira, Chave de fenda"
            }
          },
          {
            id: "ilu-fita-led",
            nome: "InstalaçÍo de fita LED em sancas",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Fita LED 12V/24V, Fonte/driver, Perfil difusor de alumínio",
              insumo: "Conectores, Emendas, Fita dupla face 3M"
            }
          },
          {
            id: "ilu-arandela",
            nome: "InstalaçÍo de arandelas",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Arandela (modelo especificado)",
              ferramenta: "Furadeira, Nível"
            }
          },
          {
            id: "ilu-balizador",
            nome: "InstalaçÍo de balizadores",
            tempoEstimadoMinutos: 15,
            recursos: {
              produto: "Balizador de embutir/sobrepor"
            }
          }
        ]
      },
      {
        id: "ilu-ajuste",
        nome: "Ajuste e ProgramaçÍo",
        descricao: "Foco de spots, temperatura de cor e integraçÍo com automaçÍo.",
        tasks: [
          {
            id: "ilu-foco",
            nome: "Ajuste de foco e ângulo dos spots",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Escada, Chave Allen"
            }
          },
          {
            id: "ilu-dimmer",
            nome: "ConfiguraçÍo de dimmers",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Dimmer (rotativo/touch/inteligente)"
            }
          },
          {
            id: "ilu-teste",
            nome: "Teste geral de circuitos e cenas",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Luxímetro (validaçÍo)"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Vidraçaria (3 fases)
  // ============================================================
  vidracaria: {
    ...baseFlow,
    id: "vidracaria",
    nome: "Vidraçaria — Boxes, Espelhos e Divisórias",
    descricao: "Fluxo de vidraçaria: mediçÍo, fabricaçÍo e instalaçÍo de boxes, espelhos e divisórias de vidro.",
    fases: [
      {
        id: "vid-medicao",
        nome: "MediçÍo",
        descricao: "MediçÍo técnica in loco.",
        tasks: [
          {
            id: "vid-visita",
            nome: "Visita técnica e mediçÍo",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Trena, Nível, Inclinômetro"
            }
          },
          {
            id: "vid-gabarito",
            nome: "Gabarito de furos e recortes",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Papel kraft / PapelÍo para gabarito"
            }
          }
        ]
      },
      {
        id: "vid-fabricacao",
        nome: "FabricaçÍo e Beneficiamento",
        descricao: "Corte, têmpera, furaçÍo e bisotê.",
        tasks: [
          {
            id: "vid-corte",
            nome: "Corte e têmpera do vidro",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Vidro temperado 8mm/10mm (box), Espelho 4mm/6mm"
            }
          },
          {
            id: "vid-furacao",
            nome: "FuraçÍo e recortes",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "CNC de vidro, Serra copo diamantada"
            }
          },
          {
            id: "vid-bisote",
            nome: "Bisotê e lapidaçÍo de bordas",
            tempoEstimadoMinutos: 45,
            recursos: {
              ferramenta: "Lapidadora, Rebolos diamantados"
            }
          }
        ]
      },
      {
        id: "vid-instalacao",
        nome: "InstalaçÍo",
        descricao: "InstalaçÍo de boxes, espelhos e divisórias.",
        tasks: [
          {
            id: "vid-box",
            nome: "InstalaçÍo de box de banheiro",
            tempoEstimadoMinutos: 90,
            recursos: {
              produto: "Kit box (perfil, dobradiças, puxador)",
              insumo: "Silicone, Bucha + Parafuso",
              ferramenta: "Furadeira, Nível"
            }
          },
          {
            id: "vid-espelho",
            nome: "InstalaçÍo de espelho",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Espelho temperado/bisotado",
              insumo: "Cola espelho, Fita dupla face, Parafusos",
              ferramenta: "Nível"
            }
          },
          {
            id: "vid-divisoria",
            nome: "InstalaçÍo de divisória de vidro",
            tempoEstimadoMinutos: 60,
            recursos: {
              produto: "Vidro temperado, Ferragens (dobradiças/pivotantes)",
              insumo: "Silicone estrutural",
              ferramenta: "Furadeira, Nível, Ventosas"
            }
          },
          {
            id: "vid-vedacao",
            nome: "VedaçÍo com silicone",
            tempoEstimadoMinutos: 20,
            recursos: {
              insumo: "Silicone neutro, Fita crepe"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Acabamentos Gerais (3 fases)
  // ============================================================
  acabamentos: {
    ...baseFlow,
    id: "acabamentos",
    nome: "Acabamentos — Rodapés, Soleiras e Detalhes",
    descricao: "Fluxo de acabamentos finais: rodapés, soleiras, filetes e ajustes gerais.",
    fases: [
      {
        id: "aba-rodape",
        nome: "Rodapés e Soleiras",
        descricao: "InstalaçÍo de rodapés e soleiras.",
        tasks: [
          {
            id: "aba-rodape-piso",
            nome: "Rodapé de porcelanato/cerâmica",
            tempoEstimadoMinutos: 120,
            recursos: {
              insumo: "Argamassa AC-II, Espaçadores",
              ferramenta: "Cortadora de piso, Desempenadeira dentada"
            }
          },
          {
            id: "aba-rodape-madeira",
            nome: "Rodapé de madeira/MDF/poliestireno",
            tempoEstimadoMinutos: 90,
            recursos: {
              produto: "Rodapé (MDF/poliestireno/madeira maciça)",
              insumo: "Cola PU, Pinos sem cabeça",
              ferramenta: "Serra de esquadria, Pinador"
            }
          },
          {
            id: "aba-soleira",
            nome: "Soleiras e peitoris",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Argamassa, Silicone",
              ferramenta: "Nível"
            }
          },
          {
            id: "aba-filete",
            nome: "Filetes decorativos e perfis de acabamento",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Filete de inox/alumínio, Perfil de acabamento",
              insumo: "Silicone, Cola"
            }
          }
        ]
      },
      {
        id: "aba-portas",
        nome: "Portas e Ferragens",
        descricao: "InstalaçÍo de portas, batentes e ferragens.",
        tasks: [
          {
            id: "aba-batente",
            nome: "InstalaçÍo de batentes/guarnições",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Batente / Kit porta pronta",
              insumo: "Espuma PU expansiva, Calços",
              ferramenta: "Nível, Furadeira"
            }
          },
          {
            id: "aba-porta",
            nome: "InstalaçÍo de folha de porta",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Folha de porta (madeira/MDF/laca)",
              ferramenta: "Chave de fenda, FormÍo"
            }
          },
          {
            id: "aba-fechadura",
            nome: "InstalaçÍo de fechaduras e maçanetas",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Fechadura / Maçaneta (modelo especificado)",
              ferramenta: "Furadeira, Serra copo, FormÍo"
            }
          }
        ]
      },
      {
        id: "aba-detalhes",
        nome: "Detalhes Finais",
        descricao: "Ajustes, retoques e arremates finais.",
        tasks: [
          {
            id: "aba-rejunte",
            nome: "Rejunte de rodapé e arremates",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Rejunte, Silicone"
            }
          },
          {
            id: "aba-retoque",
            nome: "Retoque de pintura (pós-acabamento)",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Tinta (sobra da obra), Trincha pequena"
            }
          },
          {
            id: "aba-calafetacao",
            nome: "CalafetaçÍo de frestas e juntas",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Silicone neutro, Acrílico selador"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Marcenaria (3 fases)
  // ============================================================
  marcenaria: {
    ...baseFlow,
    id: "marcenaria",
    nome: "Marcenaria — Móveis Planejados",
    descricao: "Fluxo de marcenaria: conferência, instalaçÍo e acabamento de móveis planejados.",
    fases: [
      {
        id: "mrc-conferencia",
        nome: "Conferência e PreparaçÍo",
        descricao: "Recebimento, conferência de peças e preparaçÍo do local.",
        tasks: [
          {
            id: "mrc-recebimento",
            nome: "Recebimento e conferência de peças",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "Lista de peças / Romaneio"
            }
          },
          {
            id: "mrc-protecao",
            nome: "ProteçÍo de piso e paredes",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "PapelÍo, Lona, Fita crepe"
            }
          },
          {
            id: "mrc-marcacao",
            nome: "MarcaçÍo de pontos de fixaçÍo",
            tempoEstimadoMinutos: 45,
            recursos: {
              ferramenta: "Nível laser, Trena, Lápis de marcaçÍo"
            }
          }
        ]
      },
      {
        id: "mrc-montagem",
        nome: "Montagem e InstalaçÍo",
        descricao: "Montagem dos módulos e fixaçÍo na parede.",
        tasks: [
          {
            id: "mrc-modulos-base",
            nome: "Montagem de módulos base (gabinetes/caixas)",
            tempoEstimadoMinutos: 360,
            recursos: {
              ferramenta: "Parafusadeira, Furadeira, Nível, Esquadro",
              insumo: "Parafusos, Minifix, Cavilha, Cola PVA"
            }
          },
          {
            id: "mrc-fixacao",
            nome: "FixaçÍo na parede (mÍo-francesa/cantoneira)",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "MÍo-francesa, Parafusos + Buchas, Cantoneira reforçada",
              ferramenta: "Furadeira, Nível"
            }
          },
          {
            id: "mrc-aereosup",
            nome: "Montagem de aéreos e módulos superiores",
            tempoEstimadoMinutos: 240,
            recursos: {
              ferramenta: "Parafusadeira, Nível, Grampo"
            }
          },
          {
            id: "mrc-prateleira",
            nome: "InstalaçÍo de prateleiras e divisórias internas",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Suportes de prateleira, Pinos"
            }
          }
        ]
      },
      {
        id: "mrc-acabamento",
        nome: "Acabamento e Ajustes",
        descricao: "Portas, gavetas, puxadores e ajustes finais.",
        tasks: [
          {
            id: "mrc-portas",
            nome: "InstalaçÍo de portas e regulagem de dobradiças",
            tempoEstimadoMinutos: 90,
            recursos: {
              insumo: "Dobradiça 35mm com amortecedor, Parafusos",
              ferramenta: "Parafusadeira, Chave Phillips"
            }
          },
          {
            id: "mrc-gavetas",
            nome: "InstalaçÍo de gavetas (corrediça telescópica)",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Corrediça telescópica com amortecedor",
              ferramenta: "Parafusadeira, Nível"
            }
          },
          {
            id: "mrc-puxadores",
            nome: "InstalaçÍo de puxadores",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Puxadores (modelo especificado)",
              ferramenta: "Gabarito de furaçÍo, Furadeira"
            }
          },
          {
            id: "mrc-ajuste-final",
            nome: "Ajuste final e limpeza",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Cera de retoque, Limpa móveis, Pano microfibra"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Eletros / Eletrodomésticos (2 fases)
  // ============================================================
  eletros: {
    ...baseFlow,
    id: "eletros",
    nome: "Eletrodomésticos — InstalaçÍo e Teste",
    descricao: "Fluxo de instalaçÍo de eletrodomésticos: verificaçÍo de pontos, instalaçÍo e teste de funcionamento.",
    fases: [
      {
        id: "elr-verificacao",
        nome: "VerificaçÍo e PreparaçÍo",
        descricao: "Conferência de pontos elétricos, hidráulicos e de gás.",
        tasks: [
          {
            id: "elr-pontos",
            nome: "VerificaçÍo de pontos (elétrica, água, gás, esgoto)",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Multímetro, Trena"
            }
          },
          {
            id: "elr-desembalar",
            nome: "Desembalagem e conferência do equipamento",
            tempoEstimadoMinutos: 15,
            recursos: {
              ferramenta: "Estilete, Lista de verificaçÍo"
            }
          },
          {
            id: "elr-protecao",
            nome: "ProteçÍo do piso para movimentaçÍo",
            tempoEstimadoMinutos: 10,
            recursos: {
              insumo: "PapelÍo, Cobertor"
            }
          }
        ]
      },
      {
        id: "elr-instalacao",
        nome: "InstalaçÍo e Teste",
        descricao: "InstalaçÍo, conexÍo e teste de cada equipamento.",
        tasks: [
          {
            id: "elr-cooktop",
            nome: "InstalaçÍo de cooktop (gás/induçÍo)",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Cooktop",
              insumo: "Flexível de gás (se gás), Fita veda-rosca, Silicone de vedaçÍo"
            }
          },
          {
            id: "elr-forno",
            nome: "InstalaçÍo de forno elétrico/micro-ondas embutido",
            tempoEstimadoMinutos: 20,
            recursos: {
              produto: "Forno elétrico / Micro-ondas",
              ferramenta: "Nível, Parafusadeira"
            }
          },
          {
            id: "elr-coifa",
            nome: "InstalaçÍo de coifa/depurador",
            tempoEstimadoMinutos: 45,
            recursos: {
              produto: "Coifa / Depurador",
              insumo: "Duto de alumínio, Abraçadeiras, Bucha + Parafuso",
              ferramenta: "Furadeira, Serra copo"
            }
          },
          {
            id: "elr-geladeira",
            nome: "Posicionamento de geladeira/freezer",
            tempoEstimadoMinutos: 15,
            recursos: {
              produto: "Geladeira / Freezer"
            }
          },
          {
            id: "elr-lava-louca",
            nome: "InstalaçÍo de lava-louça",
            tempoEstimadoMinutos: 30,
            recursos: {
              produto: "Lava-louça",
              insumo: "Flexível de entrada/saída, SifÍo, Abraçadeiras"
            }
          },
          {
            id: "elr-lava-roupa",
            nome: "InstalaçÍo de lava-roupa/secadora",
            tempoEstimadoMinutos: 25,
            recursos: {
              produto: "Máquina de lavar / Secadora",
              insumo: "Mangueira de entrada/saída, Pés niveladores"
            }
          },
          {
            id: "elr-teste-geral",
            nome: "Teste de funcionamento geral",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Multímetro, Termômetro (forno/geladeira)"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Cortinas e Persianas (3 fases)
  // ============================================================
  cortinasPersianas: {
    ...baseFlow,
    id: "cortinas-persianas",
    nome: "Cortinas e Persianas — Fornecimento e InstalaçÍo",
    descricao: "Fluxo de cortinas e persianas: mediçÍo, infraestrutura, instalaçÍo e fornecimento de produtos. Ref: Hunter Douglas, Luxaflex, Decortini.",
    fases: [
      {
        id: "ctp-medicao",
        nome: "MediçÍo e Infraestrutura",
        descricao: "Visita técnica, mediçÍo de vÍos e preparaçÍo de suportes.",
        tasks: [
          {
            id: "ctp-visita",
            nome: "MediçÍo e projeto (visita técnica)",
            tempoEstimadoMinutos: 90,
            recursos: {
              ferramenta: "Trena laser, Nível"
            }
          },
          {
            id: "ctp-trilho",
            nome: "Trilho suíço / Suporte roller",
            tempoEstimadoMinutos: 30,
            recursos: {
              infra: "Trilho suíço / Suporte roller duplo"
            }
          },
          {
            id: "ctp-motor",
            nome: "Motor tubular (se motorizada)",
            tempoEstimadoMinutos: 20,
            recursos: {
              infra: "Motor tubular Somfy/Nice"
            }
          },
          {
            id: "ctp-fixacao",
            nome: "Parafusos, buchas, fita dupla face",
            tempoEstimadoMinutos: 15,
            recursos: {
              insumo: "Parafusos, Buchas, Fita dupla face"
            }
          }
        ]
      },
      {
        id: "ctp-instalacao",
        nome: "InstalaçÍo",
        descricao: "InstalaçÍo de trilhos, cortinas/persianas e motorizaçÍo.",
        tasks: [
          {
            id: "ctp-inst-trilho",
            nome: "InstalaçÍo de trilho/suporte",
            tempoEstimadoMinutos: 45,
            recursos: {
              ferramenta: "Furadeira, Nível laser"
            }
          },
          {
            id: "ctp-inst-cortina",
            nome: "InstalaçÍo de cortina/persiana",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Escada, Chave de fenda"
            }
          },
          {
            id: "ctp-motorizacao",
            nome: "ProgramaçÍo motorizaçÍo (se aplicável)",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Controle remoto, App do fabricante"
            }
          }
        ]
      },
      {
        id: "ctp-produtos",
        nome: "Produto",
        descricao: "Produtos de cortinas e persianas de alto padrÍo.",
        tasks: [
          {
            id: "ctp-horizontal",
            nome: "Persiana Horizontal Alumínio (Hunter Douglas)",
            recursos: {
              produto: "Persiana horizontal alumínio — R$ 400-1.200/m²"
            }
          },
          {
            id: "ctp-rolo",
            nome: "Cortina Rolô Blackout",
            recursos: {
              produto: "Cortina rolô blackout — R$ 500-1.500/m²"
            }
          },
          {
            id: "ctp-silhouette",
            nome: "Silhouette (Hunter Douglas)",
            recursos: {
              produto: "Silhouette Hunter Douglas — R$ 1.200-3.000/m²"
            }
          },
          {
            id: "ctp-duette",
            nome: "Duette Honeycomb (Hunter Douglas)",
            recursos: {
              produto: "Duette Honeycomb — R$ 800-2.500/m²"
            }
          },
          {
            id: "ctp-romana",
            nome: "Cortina Romana Tecido",
            recursos: {
              produto: "Cortina romana tecido — R$ 600-1.800/m²"
            }
          },
          {
            id: "ctp-trilho-suico",
            nome: "Cortina com Trilho Suíço",
            recursos: {
              produto: "Cortina com trilho suíço — R$ 400-1.200/m²"
            }
          },
          {
            id: "ctp-powerview",
            nome: "Sistema PowerView Motorizado",
            recursos: {
              produto: "PowerView motorizado — R$ 1.500-5.000/janela"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Móveis Convencionais (3 fases)
  // ============================================================
  moveisConvencionais: {
    ...baseFlow,
    id: "moveis-convencionais",
    nome: "Móveis Convencionais — Fornecimento e Montagem",
    descricao: "Fluxo de móveis soltos de alto padrÍo: fornecimento, outdoor e entrega/montagem. Ref: Artefacto, Breton, Saccaro, Tidelli.",
    fases: [
      {
        id: "mvc-fornecimento",
        nome: "Fornecimento",
        descricao: "Móveis soltos de alto padrÍo para ambientes internos.",
        tasks: [
          {
            id: "mvc-sofa",
            nome: "Sofá 3 lugares (Artefacto/Breton/Saccaro)",
            recursos: {
              produto: "Sofá 3 lugares — R$ 15.000-80.000"
            }
          },
          {
            id: "mvc-poltrona",
            nome: "Poltrona (Artefacto/Breton)",
            recursos: {
              produto: "Poltrona — R$ 8.000-35.000"
            }
          },
          {
            id: "mvc-mesa-jantar",
            nome: "Mesa de Jantar (Breton/Saccaro)",
            recursos: {
              produto: "Mesa de jantar — R$ 8.000-50.000"
            }
          },
          {
            id: "mvc-cadeiras",
            nome: "Cadeiras de Jantar (un)",
            recursos: {
              produto: "Cadeira de jantar — R$ 2.000-12.000"
            }
          },
          {
            id: "mvc-mesa-centro",
            nome: "Mesa de Centro (Artefacto/Lattoog)",
            recursos: {
              produto: "Mesa de centro — R$ 3.000-20.000"
            }
          },
          {
            id: "mvc-aparador",
            nome: "Aparador/Buffet",
            recursos: {
              produto: "Aparador/Buffet — R$ 5.000-30.000"
            }
          },
          {
            id: "mvc-cama",
            nome: "Cama + Cabeceira",
            recursos: {
              produto: "Cama + Cabeceira — R$ 8.000-40.000"
            }
          },
          {
            id: "mvc-comoda",
            nome: "Cômoda",
            recursos: {
              produto: "Cômoda — R$ 4.000-20.000"
            }
          },
          {
            id: "mvc-criado",
            nome: "Criado-Mudo (par)",
            recursos: {
              produto: "Criado-mudo (par) — R$ 3.000-15.000"
            }
          },
          {
            id: "mvc-estante",
            nome: "Estante/Prateleira",
            recursos: {
              produto: "Estante/Prateleira — R$ 5.000-25.000"
            }
          }
        ]
      },
      {
        id: "mvc-outdoor",
        nome: "Outdoor (Tidelli/Saccaro)",
        descricao: "Móveis de alto padrÍo para áreas externas.",
        tasks: [
          {
            id: "mvc-sofa-out",
            nome: "Sofá Outdoor",
            recursos: {
              produto: "Sofá outdoor — R$ 15.000-60.000"
            }
          },
          {
            id: "mvc-mesa-out",
            nome: "Mesa Jantar Outdoor",
            recursos: {
              produto: "Mesa jantar outdoor — R$ 8.000-35.000"
            }
          },
          {
            id: "mvc-daybed",
            nome: "Espreguiçadeira/Daybed",
            recursos: {
              produto: "Espreguiçadeira/Daybed — R$ 8.000-30.000"
            }
          },
          {
            id: "mvc-ombrelone",
            nome: "Ombrelone",
            recursos: {
              produto: "Ombrelone — R$ 3.000-15.000"
            }
          }
        ]
      },
      {
        id: "mvc-entrega",
        nome: "Entrega e Montagem",
        descricao: "Frete, entrega e montagem/posicionamento de móveis.",
        tasks: [
          {
            id: "mvc-frete",
            nome: "Frete e entrega",
            tempoEstimadoMinutos: 120,
            recursos: {
              ferramenta: "CaminhÍo baú, Carrinho de transporte"
            }
          },
          {
            id: "mvc-montagem",
            nome: "Montagem e posicionamento",
            tempoEstimadoMinutos: 90,
            recursos: {
              ferramenta: "Chave Allen, Parafusadeira",
              insumo: "Feltro protetor de piso"
            }
          }
        ]
      }
    ]
  },

  // ============================================================
  // FLOW: Limpeza Pós Obra (3 fases)
  // ============================================================
  limpeza: {
    ...baseFlow,
    id: "limpeza",
    nome: "Limpeza Pós Obra — Entrega Final",
    descricao: "Fluxo de limpeza pós obra: limpeza grossa, limpeza fina e entrega ao cliente.",
    fases: [
      {
        id: "lmp-grossa",
        nome: "Limpeza Grossa",
        descricao: "RemoçÍo de entulho residual, poeira pesada e resíduos de obra.",
        tasks: [
          {
            id: "lmp-entulho",
            nome: "Retirada de entulho residual",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Pá, Vassoura, Carrinho de mÍo",
              insumo: "Sacos de ráfia 60L",
              epi: "Luvas + Máscara"
            }
          },
          {
            id: "lmp-aspiracao",
            nome: "AspiraçÍo de pó fino (gesso, cimento)",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Aspirador industrial",
              epi: "Máscara PFF2"
            }
          },
          {
            id: "lmp-remover-protecao",
            nome: "RemoçÍo de proteções (papelÍo, lona, fita)",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Estilete, Espátula"
            }
          }
        ]
      },
      {
        id: "lmp-fina",
        nome: "Limpeza Fina",
        descricao: "Limpeza detalhada de vidros, louças, metais e revestimentos.",
        tasks: [
          {
            id: "lmp-vidros",
            nome: "Limpeza de vidros e espelhos",
            tempoEstimadoMinutos: 60,
            recursos: {
              insumo: "Limpa vidros, Pano microfibra, Rodo"
            }
          },
          {
            id: "lmp-piso",
            nome: "Limpeza de piso (remoçÍo de resíduos de rejunte/tinta)",
            tempoEstimadoMinutos: 90,
            recursos: {
              insumo: "Removedor de rejunte, Álcool isopropílico, Pano microfibra",
              ferramenta: "Enceradeira / MOP profissional"
            }
          },
          {
            id: "lmp-loucas-metais",
            nome: "Limpeza de louças e metais",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Limpa inox, Detergente neutro, Pano macio"
            }
          },
          {
            id: "lmp-moveis",
            nome: "Limpeza de marcenaria e móveis",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Limpa móveis, Pano microfibra, Spray antiestático"
            }
          }
        ]
      },
      {
        id: "lmp-entrega",
        nome: "Vistoria e Entrega",
        descricao: "Vistoria final e entrega ao cliente.",
        tasks: [
          {
            id: "lmp-checklist",
            nome: "Checklist de vistoria final",
            tempoEstimadoMinutos: 60,
            recursos: {
              ferramenta: "Checklist impresso / App de vistoria"
            }
          },
          {
            id: "lmp-retoque",
            nome: "Retoques de pintura e calafetaçÍo",
            tempoEstimadoMinutos: 45,
            recursos: {
              insumo: "Tinta (sobra), Silicone, Trincha pequena"
            }
          },
          {
            id: "lmp-impermeabilizar",
            nome: "ImpermeabilizaçÍo de piso (se necessário)",
            tempoEstimadoMinutos: 30,
            recursos: {
              insumo: "Impermeabilizante de porcelanato"
            }
          },
          {
            id: "lmp-entrega-chaves",
            nome: "Entrega de chaves e manuais",
            tempoEstimadoMinutos: 30,
            recursos: {
              ferramenta: "Pasta com manuais, garantias e contatos"
            }
          }
        ]
      }
    ]
  }
};

// ============================================================
// MAPEAMENTO: código EVF → chave do flow
// ============================================================
export const EVF_CATEGORIA_TO_FLOW: Record<string, string> = {
  // F0 - Planejamento
  arquitetura: "arquitetura",
  documentacao: "documentacao",
  staff: "arquitetura",               // Staff usa ref de arquitetura (MDO genérico)
  kick_off: "arquitetura",            // Kick-off usa ref de arquitetura
  // F1 - PreparaçÍo
  pre_obra_protecoes: "preObraProtecoes",
  pre_obra: "preObraProtecoes",        // Pré Obra e Remoções → similar a Proteções
  demolicoes: "demolicoes",
  icamento: "icamento",
  // F2 - Estrutura
  paredes: "alvenaria",               // Paredes → redireciona para Alvenaria
  alvenaria: "alvenaria",
  drywall: "drywall",
  material_basico: "materialBasico",
  // F3 - Instalações
  eletrica: "eletrica",
  hidrossanitaria: "hidrossanitaria",
  gas: "gas",
  aquecedor_gas: "aquecedorGas",
  infra_ar: "arCondicionado",          // Infra Ar → usa flow de Ar Condicionado (fase infra)
  infra_ar_condicionado: "arCondicionado",
  ar_condicionado: "arCondicionado",
  automacao: "automacao",
  material_eletrico_hidraulico: "eletrica", // Mat Elétrico → ref de Elétrica
  tomadas_interruptores: "pontoTomada",
  // F4 - Revestimentos
  gesso: "gesso",
  piso: "piso",
  pintura: "pintura",
  material_pintura: "materialPintura",
  marmoraria: "marmoraria",
  // F5 - Acabamentos
  envidracamento: "envidracamento",
  vidracaria: "vidracaria",
  cubas_loucas_metais: "cubasLoucasMetais",
  iluminacao: "iluminacao",
  loucas_metais: "cubasLoucasMetais",  // Louças e Metais → ref de CLM
  acabamentos: "acabamentos",
  // F6 - Mobiliário
  marcenaria: "marcenaria",
  eletrodomesticos: "eletros",         // Eletrodomésticos → ref de Eletros
  eletros: "eletros",
  cortinas_persianas: "cortinasPersianas",
  moveis_convencionais: "moveisConvencionais",
  // F7 - FinalizaçÍo e Apoio
  finalizacao: "limpeza",             // FinalizaçÍo → ref de Limpeza (vistoria/entrega)
  limpeza: "limpeza",
  mao_obra: "alvenaria",             // MÍo de Obra genérico → ref de Alvenaria
  producao: "arquitetura",            // ProduçÍo → ref de Arquitetura (serviço)
};

