import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile, unlink, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);

/**
 * Transcodifica video para H.265 1080p via FFmpeg.
 * Retorna buffer do arquivo transcodificado.
 */
export async function ffmpegTranscode(
  buffer: Buffer,
  maxHeight = 1080,
  crf = '28',
  preset = 'medium',
): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'alexandria-video-'));
  const inputPath = join(tmpDir, 'input');
  const outputPath = join(tmpDir, 'output.mp4');

  try {
    await writeFile(inputPath, buffer);

    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-c:v', 'libx265',
      '-preset', preset,
      '-crf', crf,
      '-vf', `scale=-2:${maxHeight}`,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ], { timeout: 600_000 });

    return readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Gera preview de video 480p — primeiros 10 segundos, sem audio.
 */
export async function ffmpegPreview(
  buffer: Buffer,
  maxHeight = 480,
): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'alexandria-preview-'));
  const inputPath = join(tmpDir, 'input');
  const outputPath = join(tmpDir, 'preview.mp4');

  try {
    await writeFile(inputPath, buffer);

    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-t', '10',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '30',
      '-vf', `scale=-2:${maxHeight}`,
      '-an',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ], { timeout: 120_000 });

    return readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Extrai metadata de video via ffprobe.
 */
export async function ffprobe(
  buffer: Buffer,
): Promise<Record<string, unknown>> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'alexandria-probe-'));
  const inputPath = join(tmpDir, 'input');

  try {
    await writeFile(inputPath, buffer);

    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath,
    ]);

    const probe = JSON.parse(stdout);
    const videoStream = probe.streams?.find((s: any) => s.codec_type === 'video');

    return {
      duration: parseFloat(probe.format?.duration || '0'),
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
      codec: videoStream?.codec_name ?? null,
      format: probe.format?.format_name ?? null,
    };
  } catch {
    return { duration: 0, width: null, height: null, codec: null, format: null };
  } finally {
    await unlink(inputPath).catch(() => {});
  }
}
