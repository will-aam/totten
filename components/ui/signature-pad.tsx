"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Ajusta o tamanho do canvas para o tamanho da tela do dispositivo
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      const { width } = canvas.parentElement.getBoundingClientRect();
      canvas.width = width;
      canvas.height = 200; // Altura fixa para a área de assinatura

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000"; // Cor da caneta (preta)
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Evita scroll da tela no celular enquanto assina
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setIsEmpty(false);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Dispara a conversão da assinatura para Base64 assim que o usuário levanta o dedo
    if (canvasRef.current && !isEmpty) {
      const base64Signature = canvasRef.current.toDataURL("image/png");
      onSignatureChange(base64Signature);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
      onSignatureChange(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative border-2 border-dashed border-border bg-background rounded-xl overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair bg-muted/10"
        />

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/50 font-medium">
            Assine aqui
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          disabled={isEmpty}
          className="text-muted-foreground hover:text-destructive"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>
    </div>
  );
}
