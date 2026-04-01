// src/components/AssinaturaCanvas.tsx

import SignaturePad from "react-signature-canvas";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function AssinaturaCanvas({ onSalvar }: { onSalvar: (dataUrl: string) => void }) {
  const { toast } = useToast();
  const padRef = useRef<SignaturePad>(null);
  const [vazio, setVazio] = useState(true);

  function limpar() {
    padRef.current?.clear();
    setVazio(true);
  }

  function salvar() {
    if (padRef.current?.isEmpty()) {
      toast({ variant: "destructive", title: "Assine antes de salvar" });
      return;
    }
    const assinatura = padRef.current?.toDataURL();
    if (assinatura) {
      onSalvar(assinatura);
    }
  }

  return (
    <div>
      <h3>Assinatura do Cliente</h3>
      <div style={{ border: "1px solid #ccc", marginBottom: "8px" }}>
        <SignaturePad
          ref={padRef}
          canvasProps={{ width: 400, height: 150, className: "sigCanvas" }}
          onEnd={() => setVazio(false)}
        />
      </div>
      <button onClick={salvar} disabled={vazio}>Salvar Assinatura</button>
      <button onClick={limpar} style={{ marginLeft: "8px" }}>Limpar</button>
    </div>
  );
}

