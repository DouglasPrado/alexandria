"use client";

import { useCluster } from "@/hooks/useCluster";
import { Button } from "@/components/ui";
import { Header } from "@/components/layouts/Header";
import { useUploadFile } from "../hooks/useUploadFile";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { UploadDropzone } from "./UploadDropzone";
import { UploadQueue } from "./UploadQueue";

export function UploadPage() {
  const { cluster } = useCluster();
  const { items, addFiles, updateStatus } = useUploadQueue();
  const uploadFile = useUploadFile();

  const handleUploadAll = async () => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "pending") continue;
      updateStatus(i, "uploading");

      try {
        await uploadFile.mutateAsync({
          file: items[i].file,
          clusterId: cluster?.id ?? "",
        });
        updateStatus(i, "done");
      } catch (e) {
        updateStatus(i, "error", (e as Error).message);
      }
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div>
      <Header title="Enviar Arquivos" />
      <UploadDropzone onFiles={addFiles} />

      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text">
              {items.length} arquivo(s) selecionado(s)
            </p>
            {pendingCount > 0 && (
              <Button onClick={handleUploadAll}>Enviar Todos</Button>
            )}
          </div>
          <UploadQueue items={items} />
        </div>
      )}
    </div>
  );
}
