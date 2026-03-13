/**
 * Client-side image processing utilities for avatar uploads.
 * Uses the Canvas API to resize and compress images before upload —
 * zero dependencies, processing happens in the browser.
 */

/** Output dimensions for processed avatars (square) */
export const AVATAR_SIZE = 256

/** WebP quality (0–1) */
const WEBP_QUALITY = 0.85

/** JPEG fallback quality (0–1) */
const JPEG_QUALITY = 0.9

function supportsWebP(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      type,
      quality
    )
  })
}

/**
 * Processes an avatar image: center-crops to square and resizes to 256×256.
 * Outputs WebP (preferred) or JPEG (fallback). Handles transparency for WebP;
 * fills white background for JPEG.
 */
export async function processAvatarImage(file: File): Promise<Blob> {
  const img = await loadImage(file)

  const { naturalWidth: w, naturalHeight: h } = img

  // Center-crop to square: use shorter dimension as edge length
  const cropSize = Math.min(w, h)
  const sx = (w - cropSize) / 2
  const sy = (h - cropSize) / 2

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const useWebP = supportsWebP()
  const outputType = useWebP ? 'image/webp' : 'image/jpeg'
  const quality = useWebP ? WEBP_QUALITY : JPEG_QUALITY

  // JPEG doesn't support transparency — fill white background
  if (!useWebP) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
  }

  // Draw the center-cropped region scaled to 256×256
  ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, AVATAR_SIZE, AVATAR_SIZE)

  return canvasToBlob(canvas, outputType, quality)
}
