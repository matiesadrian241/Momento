"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UploadingFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

export function GuestUploadDropzone({ slug }: { slug: string }) {
  const [guestName, setGuestName] = useState("");
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: "pending" as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"],
      "video/*": [".mp4", ".mov"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  async function uploadFiles() {
    if (files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "done") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" } : f
        )
      );

      try {
        const presignRes = await fetch(`/api/e/${slug}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: files[i].file.name,
            contentType: files[i].file.type,
          }),
        });

        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        const { url, key } = await presignRes.json();

        await fetch(url, {
          method: "PUT",
          body: files[i].file,
          headers: { "Content-Type": files[i].file.type },
        });

        await fetch(`/api/e/${slug}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            fileName: files[i].file.name,
            contentType: files[i].file.type,
            fileSize: files[i].file.size,
            guestName: guestName || null,
          }),
        });

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "done", progress: 100 } : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error" } : f
          )
        );
      }
    }

    setIsUploading(false);
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Your name (optional)"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
      />

      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragActive
            ? "border-gray-900 bg-gray-50"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700">
          {isDragActive
            ? "Drop your photos here"
            : "Tap to select photos or drag & drop"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          JPG, PNG, HEIC, WebP, MP4 — up to 50MB each
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="max-h-60 space-y-1.5 overflow-y-auto">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"
              >
                <ImageIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-gray-700">
                  {f.file.name}
                </span>
                <span className="shrink-0">
                  {f.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                  {f.status === "done" && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {f.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              {doneCount}/{files.length} uploaded
              {errorCount > 0 && ` · ${errorCount} failed`}
            </p>
            <Button
              onClick={uploadFiles}
              disabled={isUploading || pendingCount === 0}
              isLoading={isUploading}
            >
              Upload {pendingCount > 0 ? `(${pendingCount})` : ""}
            </Button>
          </div>
        </div>
      )}

      {doneCount > 0 && doneCount === files.length && (
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
          <p className="mt-2 font-medium text-green-800">
            All photos uploaded successfully!
          </p>
          <p className="mt-1 text-sm text-green-600">
            Thank you for sharing your photos.
          </p>
        </div>
      )}
    </div>
  );
}
