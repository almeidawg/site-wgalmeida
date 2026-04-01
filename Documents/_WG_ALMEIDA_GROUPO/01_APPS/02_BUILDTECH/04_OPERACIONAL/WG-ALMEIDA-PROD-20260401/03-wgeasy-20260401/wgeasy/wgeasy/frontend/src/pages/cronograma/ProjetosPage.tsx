import { TYPOGRAPHY } from "@/constants/typography";
import { FileText, FolderOpen } from "lucide-react";

export default function ProjetosPage() {
  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-xl">
          <FolderOpen className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>Projetos</h1>
          <p className={TYPOGRAPHY.pageSubtitle}>Gerenciamento de projetos arquitetônicos</p>
        </div>
      </div>

      {/* Card de informaçÍo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-xl flex-shrink-0">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className={TYPOGRAPHY.sectionTitle}>Módulo em desenvolvimento</h3>
            <p className="text-gray-600 mt-2">
              Área destinada ao gerenciamento de projetos arquitetônicos, documentos,
              especificações e integraçÍo com as Obras.
            </p>

            <p className="text-gray-500 mt-4 text-sm font-medium">
              Em breve você terá acesso a:
            </p>

            <ul className="mt-3 space-y-2 text-gray-600 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Cadastro de projetos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Documentos anexos (PDF, DWG, imagens)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                AprovaçÍo do projeto → criaçÍo automática da obra
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Relacionamento com cliente e especificador
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Status do projeto (Prévia, Executivo, RevisÍo, Aprovado)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

