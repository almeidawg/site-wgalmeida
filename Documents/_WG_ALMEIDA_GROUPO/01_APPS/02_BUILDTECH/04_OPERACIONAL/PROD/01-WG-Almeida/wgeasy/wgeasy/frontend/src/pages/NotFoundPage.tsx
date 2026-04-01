import { Link } from "react-router-dom";
import "@/styles/notfound.css";

export default function NotFoundPage() {
  return (
    <div className="notfound-container">
      <h1 className="text-2xl font-normal text-gray-900">Erro 404</h1>
      <p className="text-[16px] text-gray-600">A página que você tentou acessar nÍo existe.</p>
      <Link to="/" className="btn-voltar text-lg">
        Voltar ao painel
      </Link>
    </div>
  );
}

