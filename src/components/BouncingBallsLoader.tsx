export default function BouncingBallsLoader() {
  const ballStyle = "text-6xl";

  return (
    <div className="flex justify-center items-center gap-4">
      <span
        className={`${ballStyle} animate-bounce`}
        style={{ animationDelay: "-0.32s" }}
      >
        🏀
      </span>
      <span
        className={`${ballStyle} animate-bounce`}
        style={{ animationDelay: "-0.16s" }}
      >
        🏐
      </span>
      <span className={`${ballStyle} animate-bounce`}>⚽</span>
    </div>
  );
}
