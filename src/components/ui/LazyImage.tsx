import React, { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  width?: number
  height?: number
  sizes?: string
  srcSet?: string
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
  width,
  height,
  sizes,
  srcSet
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  // Generate WebP srcSet if original srcSet is provided
  const generateWebPSrcSet = (originalSrcSet: string) => {
    return originalSrcSet
      .split(',')
      .map(src => {
        const [url, descriptor] = src.trim().split(' ')
        const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp')
        return descriptor ? `${webpUrl} ${descriptor}` : webpUrl
      })
      .join(', ')
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      <img
        ref={imgRef}
        src={placeholder}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />

      {/* Actual image */}
      {isInView && (
        <picture>
          {/* WebP format for modern browsers */}
          {srcSet && (
            <source
              srcSet={generateWebPSrcSet(srcSet)}
              sizes={sizes}
              type="image/webp"
            />
          )}
          
          {/* Fallback image */}
          <img
            src={hasError ? placeholder : src}
            srcSet={!hasError ? srcSet : undefined}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </picture>
      )}

      {/* Loading indicator */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}

export default LazyImage