// ==========================================
// ONBOARDING
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

export default function OnboardingPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            Onboarding
          </h1>
          <p className="text-gray-600">
            Material de divulgaçÍo, material da empresa de marketing, material para enviar para cliente, material para colaboradores e fornecedores para envio fácil e tudo em um lugar de fácil acesso
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-4">📢</div>
            <h3 className="font-normal text-gray-800 mb-2">Marketing</h3>
            <p className="text-sm text-gray-600">Material de divulgaçÍo</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="font-normal text-gray-800 mb-2">Clientes</h3>
            <p className="text-sm text-gray-600">Material para envio</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="font-normal text-gray-800 mb-2">Colaboradores</h3>
            <p className="text-sm text-gray-600">Documentos internos</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="font-normal text-gray-800 mb-2">Fornecedores</h3>
            <p className="text-sm text-gray-600">Material parceiros</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-normal text-gray-700 mb-2">
              Módulo Onboarding
            </h2>
            <p className="text-gray-500">
              Em desenvolvimento - Central de materiais e documentos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

