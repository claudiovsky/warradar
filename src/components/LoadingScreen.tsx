export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-red-400/20" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-wider">
            WAR-<span className="text-red-500">RADAR</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-2 animate-pulse">
            Loading conflict data...
          </p>
        </div>
      </div>
    </div>
  );
}
