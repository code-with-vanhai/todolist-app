/**
 * Image Optimization Utilities
 * Provides helper functions for responsive images and format optimization
 */

export interface ImageSizes {
  small: number
  medium: number
  large: number
  xlarge: number
}

export const defaultImageSizes: ImageSizes = {
  small: 320,
  medium: 768,
  large: 1024,
  xlarge: 1440
}

/**
 * Generate responsive srcSet for an image
 */
export const generateSrcSet = (
  baseUrl: string,
  sizes: ImageSizes = defaultImageSizes,
  format: 'jpg' | 'png' | 'webp' = 'jpg'
): string => {
  const srcSetEntries = Object.entries(sizes).map(([, width]) => {
    const url = `${baseUrl}?w=${width}&f=${format}&q=75`
    return `${url} ${width}w`
  })
  
  return srcSetEntries.join(', ')
}

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizes = (breakpoints?: Partial<ImageSizes>): string => {
  const sizes = { ...defaultImageSizes, ...breakpoints }
  
  return [
    `(max-width: ${sizes.small}px) ${sizes.small}px`,
    `(max-width: ${sizes.medium}px) ${sizes.medium}px`,
    `(max-width: ${sizes.large}px) ${sizes.large}px`,
    `${sizes.xlarge}px`
  ].join(', ')
}

/**
 * Check if WebP is supported
 */
export const isWebPSupported = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * Check if AVIF is supported
 */
export const isAVIFSupported = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

/**
 * Get optimal image format based on browser support
 */
export const getOptimalFormat = async (): Promise<'avif' | 'webp' | 'jpg'> => {
  if (await isAVIFSupported()) {
    return 'avif'
  }
  if (await isWebPSupported()) {
    return 'webp'
  }
  return 'jpg'
}

/**
 * Preload critical images
 */
export const preloadImage = (src: string, as: 'image' = 'image'): void => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = src
  document.head.appendChild(link)
}

/**
 * Preload multiple images
 */
export const preloadImages = (sources: string[]): void => {
  sources.forEach(src => preloadImage(src))
}

/**
 * Image compression utility (client-side)
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate image file size reduction
 */
export const calculateSizeReduction = (originalSize: number, compressedSize: number): {
  reduction: number
  percentage: string
} => {
  const reduction = originalSize - compressedSize
  const percentage = ((reduction / originalSize) * 100).toFixed(1)
  
  return {
    reduction,
    percentage: `${percentage}%`
  }
}