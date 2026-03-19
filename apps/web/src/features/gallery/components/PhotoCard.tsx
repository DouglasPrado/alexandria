import { Images, Film, FileText } from "lucide-react";
import { formatBytes, timeAgo } from "@/utils/format";
import type { FileDTO } from "../types/gallery.types";

function FileIcon({ mediaType }: { mediaType: string }) {
  switch (mediaType) {
    case "foto": return <Images className="h-8 w-8" />;
    case "video": return <Film className="h-8 w-8" />;
    default: return <FileText className="h-8 w-8" />;
  }
}

interface PhotoCardProps {
  file: FileDTO;
}

export function PhotoCard({ file }: PhotoCardProps) {
  return (
    <div className="group relative aspect-square bg-surface-elevated border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      <div className="absolute inset-0 flex items-center justify-center text-text-muted/40">
        <FileIcon mediaType={file.media_type} />
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-xs font-medium truncate">{file.original_name}</p>
        <p className="text-white/70 text-xs">
          {formatBytes(file.original_size)} · {timeAgo(file.created_at)}
        </p>
      </div>
    </div>
  );
}
