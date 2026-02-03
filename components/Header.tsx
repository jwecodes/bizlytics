import { Brain, Upload, RefreshCw } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
            <Brain className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bizlytics</h1>
            <p className="text-sm text-purple-300">
              AI-Powered Business Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 flex items-center gap-2">
            <Upload size={18} />
            Upload Data
          </button>

          <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
