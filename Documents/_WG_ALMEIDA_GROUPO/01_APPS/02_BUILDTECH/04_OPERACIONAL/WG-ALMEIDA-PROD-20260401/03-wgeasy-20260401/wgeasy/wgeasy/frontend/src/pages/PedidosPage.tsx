import { useEffect, useState } from "react";
import { listarPedidos } from "@/lib/comprasApi";
import { useNavigate } from "react-router-dom";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    listarPedidos().then(setPedidos);
  }, []);

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-normal">Pedidos de Compra</h1>
        <button
          onClick={() => nav("/compras/novo")}
          className="px-4 py-2 bg-primary text-white rounded text-lg"
        >
          Novo Pedido
        </button>
      </div>

      <div className="bg-white border rounded shadow p-4">
        <table className="w-full text-sm">
          <thead className="bg-[#F3F3F3]">
            <tr>
              <th className="p-2 text-left">Fornecedor</th>
              <th className="p-2 text-left">Obra</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left"></th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((p) => (
              <tr
                key={p.id}
                className="border-b cursor-pointer hover:bg-[#fafafa]"
                onClick={() => nav(`/compras/pedido/${p.id}`)}
              >
                <td className="p-2">{p.fornecedores?.nome}</td>
                <td className="p-2">{p.obras?.nome}</td>
                <td className="p-2">{p.status}</td>
                <td className="p-2 text-right">
                  <button className="text-blue-600 hover:underline">
                    Ver
                  </button>
                </td>
              </tr>
            ))}

            {pedidos.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-3">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
