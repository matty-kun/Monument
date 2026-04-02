interface BouncingBallsLoaderProps {
  size?: string;
}

import { motion } from "framer-motion";

export default function BouncingBallsLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ 
          opacity: [0.4, 1, 0.4],
          scale: [0.98, 1, 0.98]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="flex flex-col items-center"
      >
        <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-monument-primary via-purple-600 to-monument-primary bg-[length:200%_auto] animate-shimmer tracking-tighter">
          CITE FEST
        </div>
        <div className="text-xl md:text-2xl font-bold text-gray-400 tracking-[0.2em] mt-1">
          2026
        </div>
      </motion.div>
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
            className="w-1.5 h-1.5 rounded-full bg-monument-primary"
          />
        ))}
      </div>
    </div>
  );
}
