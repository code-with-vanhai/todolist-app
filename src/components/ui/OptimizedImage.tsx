import React from 'react'
import LazyImage from './LazyImage'
import { generateSrcSet, generateSizes } from '../../utils/imageOptimization'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean // For above-the-fold images
  sizes?: string
}

/**
 * Optimized Image Component
 * Automatically generates responsive srcSet and uses lazy loading
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes
}) => {
  // Generate responsive srcSet
  const srcSet = generateSrcSet(src, undefined, 'webp')
  const imageSizes = sizes || generateSizes()

  // For priority images (above the fold), don't use lazy loading
  if (priority) {
    return (
      <picture className={className}>
        {/* WebP format for modern browsers */}
        <source srcSet={srcSet} sizes={imageSizes} type="image/webp" />
        
        {/* Fallback for older browsers */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={imageSizes}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </picture>
    )
  }

  // Use lazy loading for non-priority images
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      sizes={imageSizes}
      srcSet={srcSet}
    />
  )
}

export default OptimizedImage