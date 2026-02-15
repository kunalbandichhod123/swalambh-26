import { motion } from "framer-motion";

export const AnimatedShinyText = ({ text }: { text: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center justify-center px-4 py-1.5 transition-all ease-out hover:duration-300"
    >
      <span className="relative inline-block bg-[linear-gradient(110deg,#2A5C43,45%,#6ee7b7,55%,#2A5C43)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_2s_infinite] font-medium text-sm">
        ✨ {text}
      </span>
    </motion.div>
  );
};