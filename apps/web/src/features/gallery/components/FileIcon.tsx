/**
 * FileIcon — componente e lógica compartilhada de ícones por tipo de arquivo.
 * Usado por GalleryGrid e TimelineView para garantir consistência visual.
 */
import {
  ImageIcon,
  Film,
  FileText,
  FileSpreadsheet,
  FileAudio,
  Archive,
  File,
  type LucideIcon,
} from 'lucide-react';

export interface FileAppearance {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

export function getFileAppearance(mediaType: string, mimeType: string, name: string): FileAppearance {
  if (mimeType === 'application/pdf') {
    return { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10', label: 'PDF' };
  }
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.oasis.opendocument.text'
  ) {
    return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'DOC' };
  }
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.oasis.opendocument.spreadsheet' ||
    mimeType === 'text/csv'
  ) {
    return { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-500/10', label: 'XLS' };
  }
  if (mimeType.startsWith('audio/')) {
    return { icon: FileAudio, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'AUDIO' };
  }
  if (mediaType === 'archive' || mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('7z') || mimeType.includes('rar')) {
    return { icon: Archive, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'ZIP' };
  }
  if (mediaType === 'video' || mimeType.startsWith('video/')) {
    return { icon: Film, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10', label: 'VIDEO' };
  }
  if (mediaType === 'photo' || mimeType.startsWith('image/')) {
    return { icon: ImageIcon, color: 'text-[var(--info)]', bg: 'bg-[var(--info)]/10', label: 'IMG' };
  }
  const ext = name.includes('.') ? name.split('.').pop()?.toUpperCase() ?? 'FILE' : 'FILE';
  return { icon: File, color: 'text-[var(--muted-foreground)]', bg: 'bg-[var(--muted)]', label: ext };
}

export function FileIcon({ mediaType, mimeType, name }: { mediaType: string; mimeType: string; name: string }) {
  const { icon: Icon, color, bg, label } = getFileAppearance(mediaType, mimeType, name);
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 ${bg}`}>
      <Icon size={32} className={color} />
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${color} opacity-80`}>{label}</span>
    </div>
  );
}
