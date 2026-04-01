// src/lib/pdfFichaColaborador.ts
import {
  Pessoa,
  PessoaDocumento,
  PessoaAvaliacao,
  PessoaObra,
} from "./pessoasApi";

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);

export async function gerarFichaPDF(
  pessoa: Pessoa,
  documentos: PessoaDocumento[],
  avaliacoes: PessoaAvaliacao[],
  obras: PessoaObra[]
) {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Ficha do Colaborador", 14, 20);

  doc.setFontSize(12);
  doc.text(pessoa.nome, 14, 30);
  if (pessoa.email) doc.text(`Email: ${pessoa.email}`, 14, 38);
  if (pessoa.telefone) doc.text(`Telefone: ${pessoa.telefone}`, 14, 46);

  // DOCUMENTOS
  autoTable(doc, {
    startY: 60,
    head: [["Documento", "DescriçÍo", "Validade"]],
    body: documentos.map((d) => [
      d.tipo,
      d.descricao ?? "",
      d.validade ? new Date(d.validade).toLocaleDateString("pt-BR") : "",
    ]),
  });

  // AVALIAÇÕES
  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY ?? 0) + 10,
    head: [["Nota", "Comentário", "Data"]],
    body: avaliacoes.map((a) => [
      a.nota.toString(),
      a.comentario ?? "",
      a.criado_em ? new Date(a.criado_em).toLocaleDateString("pt-BR") : "",
    ]),
  });

  // OBRAS
  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY ?? 0) + 10,
    head: [["Obra", "FunçÍo"]],
    body: obras.map((o) => [o.obras?.nome ?? o.obra_nome ?? "", o.funcao_na_obra ?? ""]),
  });

  doc.save(`Ficha-${pessoa.nome}.pdf`);
}

