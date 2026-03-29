'use client';

/**
 * VideoPlayer — player 480p standalone com controles nativos.
 * Fonte: docs/frontend/web/04-components.md (VideoPlayer)
 */
export function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  return (
    <video
      src={src}
      poster={poster}
      controls
      className="max-h-[80vh] w-full rounded-md bg-black"
      preload="metadata"
    >
      Seu navegador nao suporta video.
    </video>
  );
}
