"use client";

import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { useCluster } from "@/hooks/useCluster";
import { Skeleton, Button, Alert } from "@/components/ui";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Header } from "@/components/layouts/Header";
import { useGallery } from "../hooks/useGallery";
import { GalleryGrid } from "./GalleryGrid";

export function GalleryPage() {
  const router = useRouter();
  const { cluster, loading: clusterLoading, needsSetup } = useCluster();
  const { data, isLoading, error } = useGallery(cluster?.id);

  const loading = clusterLoading || isLoading;

  if (needsSetup) {
    return (
      <EmptyState
        icon={Camera}
        title="Nenhum cluster configurado"
        description="Crie um cluster para comecar"
        action={{ label: "Configurar", onClick: () => router.push("/recovery") }}
      />
    );
  }

  return (
    <div>
      <Header title="Galeria">
        <Button onClick={() => router.push("/upload")}>Enviar Arquivos</Button>
      </Header>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      )}

      {error && (
        <Alert variant="error">{error.message}</Alert>
      )}

      {!loading && !error && data && data.files.length === 0 && (
        <EmptyState
          icon={Camera}
          title="Nenhum arquivo ainda"
          description="Envie fotos e videos para comecar"
          action={{ label: "Enviar Arquivos", onClick: () => router.push("/upload") }}
        />
      )}

      {!loading && data && data.files.length > 0 && (
        <GalleryGrid files={data.files} />
      )}
    </div>
  );
}
