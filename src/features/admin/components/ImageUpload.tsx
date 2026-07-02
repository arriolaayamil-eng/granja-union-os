import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ImageUpload UI-only: muestra preview local, no sube nada a ningún servidor.
export function ImageUpload({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange?: (dataUrl: string) => void;
  className?: string;
}) {
  const [preview, setPreview] = useState<string | undefined>(value);

  const handleFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange?.(url);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted">
        {preview ? (
          <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <ImagePlus className="mb-1 h-6 w-6" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>
      <label>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" asChild>
          <span className="cursor-pointer">
            <ImagePlus className="mr-1 h-4 w-4" /> Subir foto
          </span>
        </Button>
      </label>
    </div>
  );
}
