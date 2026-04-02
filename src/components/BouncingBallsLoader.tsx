interface BouncingBallsLoaderProps {
  size?: string;
}

import { motion } from "framer-motion";

interface BouncingBallsLoaderProps {
  size?: string;
  showDots?: boolean;
}

export default function BouncingBallsLoader({ 
  size = "text-4xl", 
  showDots = true 
}: BouncingBallsLoaderProps) {
  // Determine text sizes based on the passed 'size' (e.g., text-xl, text-4xl)
  const isSmall = size.includes('text-sm') || size.includes('text-xs') || size.includes('text-xl');
  const subtextSize = isSmall ? "text-[8px]" : "text-xl md:text-2xl";
  const maintextSize = size;

  return (
    <div className="flex flex-col items-center justify-center gap-1 md:gap-4">
      <motion.div
        animate={{ 
          opacity: [0.6, 1, 0.6],
          scale: [0.99, 1, 0.99]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="flex flex-col items-center"
      >
        <div className={`${maintextSize} font-black bg-clip-text text-transparent bg-gradient-to-r from-monument-primary via-purple-600 to-monument-primary bg-[length:200%_auto] animate-shimmer tracking-tighter`}>
          CITE FEST
        </div>
        {!isSmall && (
          <div className={`${subtextSize} font-bold text-gray-400 tracking-[0.2em] mt-1`}>
            2026
          </div>
        )}
      </motion.div>
      {showDots && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeInOut" 
              }}
              className={`${isSmall ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-monument-primary`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
