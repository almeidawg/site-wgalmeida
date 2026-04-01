// src/pages/pessoas/PessoaFormPage.tsx

import { useState } from "react";

export default function PessoaFormPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-[18px] sm:text-[24px] font-normal mb-6 text-center">Nova Pessoa</h1>
      <form className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <input
              className="border p-2 rounded w-full text-lg"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div>
            <input
              className="border p-2 rounded w-full text-lg"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded hover:opacity-90 text-[14px]"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
