//! Preview generation — thumbnails e previews para galeria.
//!
//! Blueprint (07-critical_flows.md, step 8):
//!   - Foto → thumbnail ~50KB (WebP, max 200px)
//!   - Video → 480p ~5MB (v2, FFmpeg)
//!   - PDF → imagem da primeira pagina (v2, pdf-render)
//!   - Documento generico → icone por extensao
//!
//! Regras: RN-F1 (todo arquivo passa pelo pipeline), RN-F2 (originais nao preservados).

use thiserror::Error;

/// Tamanho maximo do lado maior do thumbnail (pixels).
const THUMBNAIL_MAX_DIM: u32 = 200;

/// Qualidade WebP para thumbnails (0-100).
const WEBP_QUALITY: u8 = 75;

#[derive(Debug, Error)]
pub enum PreviewError {
    #[error("formato nao suportado para preview: {0}")]
    UnsupportedFormat(String),
    #[error("erro ao processar imagem: {0}")]
    ImageError(String),
    #[error("dados de entrada vazios")]
    EmptyInput,
}

/// Resultado da geracao de preview.
#[derive(Debug, Clone)]
pub struct PreviewOutput {
    /// Bytes do preview (thumbnail/frame).
    pub data: Vec<u8>,
    /// MIME type do preview gerado.
    pub mime_type: String,
    /// Largura do preview em pixels.
    pub width: u32,
    /// Altura do preview em pixels.
    pub height: u32,
}

/// Gera preview para um arquivo baseado no media_type.
///
/// - "foto" → thumbnail WebP via crate image
/// - "video" → stub (v2: FFmpeg frame extraction)
/// - "documento" → stub (v2: PDF first page)
pub fn generate(
    data: &[u8],
    media_type: &str,
    _mime_type: &str,
) -> Result<PreviewOutput, PreviewError> {
    if data.is_empty() {
        return Err(PreviewError::EmptyInput);
    }

    match media_type {
        "foto" => generate_image_thumbnail(data),
        "video" => Err(PreviewError::UnsupportedFormat(
            "video preview requer FFmpeg (v2)".into(),
        )),
        "documento" => Err(PreviewError::UnsupportedFormat(
            "documento preview requer pdf-render (v2)".into(),
        )),
        other => Err(PreviewError::UnsupportedFormat(other.into())),
    }
}

/// Gera thumbnail de imagem: resize proporcional ao max 200px, output PNG.
///
/// Usa crate `image` (Rust puro, sem dependencia nativa).
fn generate_image_thumbnail(data: &[u8]) -> Result<PreviewOutput, PreviewError> {
    use image::ImageReader;
    use std::io::Cursor;

    let reader = ImageReader::new(Cursor::new(data))
        .with_guessed_format()
        .map_err(|e| PreviewError::ImageError(format!("formato nao reconhecido: {e}")))?;

    let img = reader
        .decode()
        .map_err(|e| PreviewError::ImageError(format!("decode falhou: {e}")))?;

    // Resize proporcional mantendo aspect ratio (sem upscale)
    let (width, height) = if img.width() <= THUMBNAIL_MAX_DIM && img.height() <= THUMBNAIL_MAX_DIM {
        // Imagem ja pequena — nao fazer upscale
        (img.width(), img.height())
    } else {
        let thumbnail = img.thumbnail(THUMBNAIL_MAX_DIM, THUMBNAIL_MAX_DIM);
        (thumbnail.width(), thumbnail.height())
    };

    let thumbnail = if img.width() > THUMBNAIL_MAX_DIM || img.height() > THUMBNAIL_MAX_DIM {
        img.thumbnail(THUMBNAIL_MAX_DIM, THUMBNAIL_MAX_DIM)
    } else {
        img
    };

    // Encode como PNG (WebP encoding requer feature extra; PNG é suficiente para v1)
    let mut buf = Vec::new();
    let mut cursor = Cursor::new(&mut buf);
    thumbnail
        .write_to(&mut cursor, image::ImageFormat::Png)
        .map_err(|e| PreviewError::ImageError(format!("encode PNG falhou: {e}")))?;

    Ok(PreviewOutput {
        data: buf,
        mime_type: "image/png".into(),
        width,
        height,
    })
}

/// Retorna true se o media_type suporta preview na v1.
pub fn is_supported(media_type: &str) -> bool {
    media_type == "foto"
}

/// Constantes expostas para testes e configuracao.
pub fn thumbnail_max_dimension() -> u32 {
    THUMBNAIL_MAX_DIM
}

#[allow(dead_code)]
pub fn webp_quality() -> u8 {
    WEBP_QUALITY
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Cria uma imagem PNG 400x300 de teste em memoria.
    fn test_png_400x300() -> Vec<u8> {
        use image::{ImageBuffer, Rgba};
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(400, 300, |x, y| {
            Rgba([(x % 256) as u8, (y % 256) as u8, 128, 255])
        });
        let mut buf = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut buf);
        img.write_to(&mut cursor, image::ImageFormat::Png).unwrap();
        buf
    }

    // RED→GREEN: foto gera thumbnail com dimensoes <= 200px
    #[test]
    fn foto_generates_thumbnail_within_max_dimension() {
        let png = test_png_400x300();
        let result = generate(&png, "foto", "image/png").unwrap();

        assert!(result.width <= THUMBNAIL_MAX_DIM);
        assert!(result.height <= THUMBNAIL_MAX_DIM);
        assert_eq!(result.mime_type, "image/png");
        assert!(!result.data.is_empty());
    }

    // RED→GREEN: thumbnail preserva aspect ratio
    #[test]
    fn thumbnail_preserves_aspect_ratio() {
        let png = test_png_400x300();
        let result = generate(&png, "foto", "image/png").unwrap();

        // 400x300 → aspect 4:3 → max 200px → 200x150
        assert_eq!(result.width, 200);
        assert_eq!(result.height, 150);
    }

    // RED→GREEN: thumbnail e menor que original
    #[test]
    fn thumbnail_is_smaller_than_original() {
        let png = test_png_400x300();
        let original_size = png.len();
        let result = generate(&png, "foto", "image/png").unwrap();

        assert!(
            result.data.len() < original_size,
            "thumbnail ({}) deve ser menor que original ({})",
            result.data.len(),
            original_size
        );
    }

    // RED→GREEN: dados vazios retorna erro
    #[test]
    fn empty_data_returns_error() {
        let result = generate(&[], "foto", "image/png");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), PreviewError::EmptyInput));
    }

    // RED→GREEN: video retorna UnsupportedFormat (v2)
    #[test]
    fn video_returns_unsupported() {
        let result = generate(b"fake video data", "video", "video/mp4");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            PreviewError::UnsupportedFormat(_)
        ));
    }

    // RED→GREEN: documento retorna UnsupportedFormat (v2)
    #[test]
    fn documento_returns_unsupported() {
        let result = generate(b"fake pdf data", "documento", "application/pdf");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            PreviewError::UnsupportedFormat(_)
        ));
    }

    // RED→GREEN: media_type desconhecido retorna erro
    #[test]
    fn unknown_media_type_returns_error() {
        let result = generate(b"data", "outro", "application/octet-stream");
        assert!(result.is_err());
    }

    // is_supported retorna true apenas para foto
    #[test]
    fn is_supported_only_for_foto() {
        assert!(is_supported("foto"));
        assert!(!is_supported("video"));
        assert!(!is_supported("documento"));
    }

    // Constante de max dimension e 200px conforme blueprint
    #[test]
    fn thumbnail_max_is_200px() {
        assert_eq!(thumbnail_max_dimension(), 200);
    }

    // Imagem ja pequena (100x80) nao e redimensionada para cima
    #[test]
    fn small_image_not_upscaled() {
        use image::{ImageBuffer, Rgba};
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(100, 80, |_, _| Rgba([255, 0, 0, 255]));
        let mut buf = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut buf);
        img.write_to(&mut cursor, image::ImageFormat::Png).unwrap();

        let result = generate(&buf, "foto", "image/png").unwrap();
        // Nao deve upscale: 100x80 < 200px
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 80);
    }
}
