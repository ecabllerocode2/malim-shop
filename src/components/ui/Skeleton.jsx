// Componente Skeleton para estados de carga
import { cn } from '../../utils/cn';

const Skeleton = ({ className, variant = 'rectangular', ...props }) => {
  const baseStyles = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%]';
  
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full',
  };
  
  return (
    <div 
      className={cn(baseStyles, variants[variant], className)} 
      {...props}
    />
  );
};

// Skeleton para producto
export const ProductSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="w-full aspect-[3/4]" />
    <Skeleton variant="text" className="w-3/4" />
    <Skeleton variant="text" className="w-1/2" />
    <div className="flex gap-2">
      <Skeleton variant="circular" className="w-8 h-8" />
      <Skeleton variant="circular" className="w-8 h-8" />
      <Skeleton variant="circular" className="w-8 h-8" />
    </div>
  </div>
);

// Skeleton para grid de productos
export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;
