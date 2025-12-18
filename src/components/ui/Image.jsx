// Componente de imagen optimizada con lazy loading
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Image = ({ 
  src, 
  alt, 
  className,
  aspectRatio = 'auto',
  objectFit = 'cover',
  priority = false,
  onLoad,
  fallback = '/placeholder.jpg',
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const aspectRatios = {
    'auto': '',
    'square': 'aspect-square',
    '3/4': 'aspect-[3/4]',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
  };
  
  const objectFits = {
    'cover': 'object-cover',
    'contain': 'object-contain',
    'fill': 'object-fill',
  };
  
  const handleLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };
  
  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };
  
  return (
    <div className={cn('relative overflow-hidden bg-gray-100', aspectRatios[aspectRatio], className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:1000px_100%]" />
      )}
      
      <motion.img
        src={error ? fallback : src}
        alt={alt}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          objectFits[objectFit],
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        {...props}
      />
    </div>
  );
};

export default Image;
