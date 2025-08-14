import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  disabled,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be smaller than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/receipt-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      if (result.url) {
        onImageUploaded(result.url);
        setUploadError(null);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setUploadError(null);
    onImageRemoved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Receipt Image</h3>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={handleUploadClick}
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
          >
            {isUploading
              ? "Uploading..."
              : currentImageUrl
              ? "Replace Image"
              : "Add Image"}
          </Button>
          {currentImageUrl && (
            <Button
              type="button"
              onClick={handleRemoveImage}
              variant="destructive"
              size="sm"
              disabled={disabled || isUploading}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload error */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Image preview */}
      {currentImageUrl && (
        <div className="space-y-2">
          <div className="relative w-full overflow-hidden rounded-xl border bg-black/5">
            <img
              src={currentImageUrl}
              alt="Receipt preview"
              className="block max-h-[300px] w-full object-contain bg-white"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-neutral-500">
            <a
              href={currentImageUrl}
              target="_blank"
              rel="noreferrer"
              className="underline hover:no-underline"
            >
              View full size →
            </a>
          </p>
        </div>
      )}

      {/* Upload instructions */}
      {!currentImageUrl && (
        <div className="text-sm text-neutral-500 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg">
          <p className="font-medium mb-1">📷 Upload Receipt Image</p>
          <ul className="text-xs space-y-1">
            <li>• Supported formats: JPG, PNG, WebP</li>
            <li>• Maximum size: 10MB</li>
            <li>• Images are automatically optimized</li>
          </ul>
        </div>
      )}
    </div>
  );
}
