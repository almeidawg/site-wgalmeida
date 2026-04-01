/**
 * Componente de Captura de Câmera
 * Permite tirar foto usando a câmera do dispositivo
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageData: string, blob: Blob) => void;
  title?: string;
}

export function CameraCapture({
  open,
  onClose,
  onCapture,
  title = "Capturar Foto",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parar stream anterior se existir
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error("Erro ao acessar câmera:", err);
      const name = err && typeof err === "object" && "name" in err ? (err as { name?: string }).name : undefined;
      if (name === "NotAllowedError") {
        setError("PermissÍo para câmera negada. Habilite nas configurações.");
      } else if (name === "NotFoundError") {
        setError("Nenhuma câmera encontrada no dispositivo.");
      } else {
        setError("Erro ao acessar a câmera. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);

    // Converter para Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      },
      "image/jpeg",
      0.9
    );

    // Parar câmera após captura
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage && capturedBlob) {
      onCapture(capturedImage, capturedBlob);
      setCapturedImage(null);
      setCapturedBlob(null);
      onClose();
    }
  }, [capturedImage, capturedBlob, onCapture, onClose]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Iniciar câmera quando modal abrir
  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }

    return () => {
      if (!open) {
        stopCamera();
        setCapturedImage(null);
        setCapturedBlob(null);
        setError(null);
      }
    };
  }, [open, capturedImage, startCamera, stopCamera]);

  // Reiniciar câmera quando mudar facingMode
  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }
  }, [facingMode, open, capturedImage, startCamera]);

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCapturedBlob(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#F25C26]" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Área de visualizaçÍo */}
          <div className="relative aspect-[4/3] bg-gray-900">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-white text-sm">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startCamera}
                    className="mt-4"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}

            {!capturedImage && !error && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {capturedImage && (
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay com guia */}
            {!capturedImage && !error && !loading && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white/70 text-xs bg-black/50 inline-block px-3 py-1 rounded-full">
                    Posicione o comprovante dentro da área
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="p-4 bg-gray-900">
            {!capturedImage ? (
              <div className="flex items-center justify-center gap-4">
                {/* Trocar câmera */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="text-white hover:bg-white/10"
                  disabled={loading || !!error}
                >
                  <SwitchCamera className="h-6 w-6" />
                </Button>

                {/* BotÍo de captura */}
                <button
                  onClick={capturePhoto}
                  disabled={loading || !!error}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <div className="w-14 h-14 rounded-full border-4 border-gray-300" />
                </button>

                {/* Fechar */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                {/* Tirar novamente */}
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1 bg-transparent border-white text-white hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tirar Novamente
                </Button>

                {/* Confirmar */}
                <Button
                  onClick={confirmPhoto}
                  className="flex-1 bg-primary hover:bg-[#D94E1F] text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Usar Foto
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CameraCapture;

