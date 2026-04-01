import React, { useRef, useState } from "react";
import Avatar from "@/components/common/Avatar";
import {
  fileToBase64,
  uploadAvatarPessoa,
  obterAvatarUrl,
} from "@/utils/avatarUtils";

interface PessoaAvatarUploaderProps {
  pessoaId?: string; // opcional: se existir, faz upload no Supabase
  nome: string;
  avatar_url?: string | null;
  foto_url?: string | null;
  avatar?: string | null;
  onChange?: (data: { avatar_url?: string; avatar?: string }) => void;
}

const PessoaAvatarUploader: React.FC<PessoaAvatarUploaderProps> = ({
  pessoaId,
  nome,
  avatar_url,
  foto_url,
  avatar,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  const currentUrl =
    localAvatarUrl || obterAvatarUrl(nome, avatar_url, foto_url, avatar);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Se já existe pessoaId, usamos Supabase Storage
      if (pessoaId) {
        const publicUrl = await uploadAvatarPessoa(file, pessoaId);
        setLocalAvatarUrl(publicUrl);
        onChange?.({ avatar_url: publicUrl });
      } else {
        // Caso ainda não exista pessoaId (novo cadastro), usamos base64 em avatar
        const base64 = await fileToBase64(file);
        setLocalAvatarUrl(base64);
        onChange?.({ avatar: base64 });
      }
    } catch (error) {
      console.error("Erro ao processar avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar
          nome={nome}
          avatar_url={currentUrl}
          size={72}
          className="shadow-md"
          onClick={handleClick}
        />
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full text-xs text-white">
            Enviando...
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleClick}
          className="px-3 py-1.5 text-xs rounded-md bg-primary text-white font-medium hover:bg-[#e45220] transition"
        >
          {isUploading ? "Enviando..." : "Alterar foto"}
        </button>
        <span className="text-[11px] text-gray-500">
          Clique para enviar uma foto. Formatos: JPG, PNG. Tamanho máx. 5MB.
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default PessoaAvatarUploader;


