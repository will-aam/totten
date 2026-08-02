export const compressImage = (file: File, maxWidth = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scaleSize = maxWidth / img.width;
        
        let width = img.width;
        let height = img.height;
        
        // Só redimensiona se a imagem for maior que o maxWidth
        if (scaleSize < 1) {
          width = img.width * scaleSize;
          height = img.height * scaleSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Exporta como JPEG com 70% de qualidade para reduzir bastante o tamanho (ótimo para previews)
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            resolve(dataUrl);
        } else {
            // Se por algum motivo o canvas falhar, retorna a imagem original em base64
            resolve(event.target?.result as string);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
