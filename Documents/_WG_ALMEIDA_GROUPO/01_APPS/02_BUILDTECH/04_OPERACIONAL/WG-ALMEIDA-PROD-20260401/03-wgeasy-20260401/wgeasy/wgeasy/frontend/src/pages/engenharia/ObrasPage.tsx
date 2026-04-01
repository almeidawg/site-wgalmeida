import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/auth/AuthContext";
import "@/styles/obras.css";

type Obra = {
  id: string;
  nome: string;
  endereco: string | null;
  status: string | null;
  data_prevista_entrega: string | null;
  criado_em?: string | null;
};

export default function ObrasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarObras() {
    setLoading(true);
    setErro(null);

    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .order("criado_em", { ascending: false });

    if (import.meta.env.DEV) console.log("📥 OBRAS RECEBIDAS:", data);
    if (import.meta.env.DEV) console.log("⚠️ ERRO AO CARREGAR OBRAS:", error);

    if (error) {
      setErro("NÍo foi possível carregar as obras.");
      setObras([]);
    } else {
      setObras((data ?? []) as Obra[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    carregarObras();
  }, [user]);

  async function handleCriarObra(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!user) {
      setErro("Faça login para criar uma obra.");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe pelo menos o nome da obra.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("obras").insert({
      user_id: user.id,
      nome,
      endereco: endereco || null,
      data_prevista_entrega: dataPrevista || null,
      status: "em_planejamento",
    });

    if (error) {
      console.error("Erro ao criar obra:", error);
      setErro("NÍo foi possível criar a obra.");
      setSalvando(false);
      return;
    }

    setNome("");
    setEndereco("");
    setDataPrevista("");

    await carregarObras();
    setSalvando(false);
  }

  return (
    <div className="obras-container">
      <h1 className="text-[18px] sm:text-[24px] font-normal uppercase tracking-[0.3em] text-[#2E2E2E]">Obras</h1>

      {/* Card de nova obra */}
      <section className="obras-form">
        <h2 className="text-[20px] font-normal text-[#2E2E2E]">Nova obra</h2>

        {!user && (
          <p style={{ color: "#b00020" }} className="text-[14px]">
            Faca login para cadastrar obras.
          </p>
        )}

        {user && (
          <form onSubmit={handleCriarObra}>
            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              placeholder="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />

            <input
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
            />

            <button type="submit" disabled={salvando} className="text-[14px]">
              {salvando ? "Salvando..." : "Criar Obra"}
            </button>
          </form>
        )}

        {erro && <p style={{ color: "#b00020", marginTop: 8 }} className="text-[14px]">{erro}</p>}
      </section>

      {/* Lista de obras */}
      <section>
        {loading && <p className="text-[14px]">Carregando obras...</p>}

        {!loading && obras.length === 0 && (
          <p className="text-[14px]">Nenhuma obra cadastrada ate o momento.</p>
        )}

        <ul className="obras-lista">
          {obras.map((obra) => (
            <li
              key={obra.id}
              className="obra-item"
              onClick={() => navigate(`/obras/${obra.id}`)}
              style={{ cursor: "pointer" }}
            >
              <strong className="text-[14px]">{obra.nome}</strong>
              <br />
              {obra.endereco && (
                <span className="text-[12px] text-[#7A7A7A]">{obra.endereco}</span>
              )}
              <br />
              <small>
                {obra.status ?? "sem status"}
                {obra.data_prevista_entrega && (
                  <> • Entrega: {obra.data_prevista_entrega}</>
                )}
              </small>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

