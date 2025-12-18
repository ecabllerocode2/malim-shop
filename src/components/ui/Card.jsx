// Componente Card con hover effects
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Card = ({ 
  children, 
  className,
  hover = false,
  padding = 'md',
  ...props 
}) => {
  const baseStyles = 'bg-white rounded-2xl shadow-soft transition-all duration-300';
  const hoverStyles = hover ? 'hover:shadow-medium hover:-translate-y-1 cursor-pointer' : '';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, hoverStyles, paddings[padding], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
  
  return (
    <div className={cn(baseStyles, paddings[padding], className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
