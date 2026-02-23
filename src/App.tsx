import React, { useState, useEffect, useRef } from 'react';
import { cn } from './lib/utils';
import { Settings, X } from 'lucide-react';

const generateRandomGradient = () => {
  const colors = [
    ['#ff9a9e', '#fecfef'], ['#a1c4fd', '#c2e9fb'], ['#667eea', '#764ba2'],
    ['#ffdde1', '#ee9ca7'], ['#fddb92', '#d1fdff'], ['#fbc2eb', '#a6c1ee'],
    ['#84fab0', '#8fd3f4'], ['#d4fc79', '#96e6a1'],
  ];
  const randomColors = colors[Math.floor(Math.random() * colors.length)];
  const angle = Math.floor(Math.random() * 360);
  return `linear-gradient(${angle}deg, ${randomColors[0]}, ${randomColors[1]})`;
};

export default function App() {
  const [quote, setQuote] = useState({ id: null, text: '' });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('random');
  const [background, setBackground] = useState(generateRandomGradient());
  const [font, setFont] = useState('font-serif');
  const [isBgEnabled, setIsBgEnabled] = useState(true);
  const [noRepeat, setNoRepeat] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then((res) => res.json()).then(setCategories);
    fetchQuote();
  }, []);

  const fetchQuote = (category = 'random') => {
    let url = category === 'random' ? '/api/quote/random' : `/api/quote/category/${category}`;
    if (noRepeat) url += `?noRepeat=true`;

    fetch(url).then((res) => res.json()).then((data) => {
      setQuote({ id: data.id, text: data.quote });
      if (isBgEnabled) setBackground(generateRandomGradient());
      if (data.id) {
        fetch('/api/quote/seen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quote_id: data.id }),
        });
        setShowReset(false);
      } else {
        setShowReset(true);
      }
    });
  };

  const handleResetSeen = () => {
    fetch('/api/seen/reset', { method: 'POST' }).then(() => {
      fetchQuote(selectedCategory);
      setShowReset(false);
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    fetchQuote(newCategory);
  };

  const handleGenerate = () => fetchQuote(selectedCategory);

  return (
    <div
      className={cn(
        'relative w-screen h-screen flex flex-col items-center justify-center p-8 transition-all duration-1000',
        !isBgEnabled && 'bg-black'
      )}
      style={isBgEnabled ? { background } : {}}
    >
      {isBgEnabled && <div className="absolute inset-0 bg-black/20"></div>}
      
      <div className="relative z-10 text-center">
        <h1 className={cn(
          "text-4xl md:text-6xl text-white transition-all",
          font
        )}>
          {quote.text}
        </h1>
        <p className="text-white/60 text-lg mt-4 font-sans">@BecomeBetterEverydayy</p>
      </div>

      {showReset && (
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-20 bg-white/10 backdrop-blur-lg p-6 rounded-lg text-center">
            <p className="text-white mb-4">You've seen all the quotes in this category.</p>
            <button onClick={handleResetSeen} className="bg-white/20 text-white rounded-full px-6 py-2 font-semibold hover:bg-white/30 transition-colors">
                Start Over
            </button>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white/80 hover:text-white transition-colors">
            {isMenuOpen ? <X size={24} /> : <Settings size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-16 right-4 z-10 bg-white/10 backdrop-blur-lg p-4 rounded-lg flex flex-col gap-4 w-64">
            <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm">Font Style</label>
                <select value={font} onChange={(e) => setFont(e.target.value)} className="bg-white/20 text-white rounded-md px-3 py-1.5 backdrop-blur-sm outline-none font-sans text-sm">
                    <option value="font-serif">Playfair Display</option>
                    <option value="font-sans">Inter</option>
                    <option value="font-mono">Roboto Mono</option>
                    <option value="font-script">Dancing Script</option>
                    <option value="font-lobster">Lobster</option>
                    <option value="font-pacifico">Pacifico</option>
                    <option value="font-caveat">Caveat</option>
                </select>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm">Category</label>
                <select value={selectedCategory} onChange={handleCategoryChange} className="bg-white/20 text-white rounded-md px-3 py-1.5 backdrop-blur-sm outline-none font-sans text-sm">
                    <option value="random">Random</option>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">No Repeat</span>
                <button onClick={() => setNoRepeat(!noRepeat)} className={cn("relative w-10 h-5 rounded-full transition-colors", noRepeat ? 'bg-green-400/50' : 'bg-white/20')}>
                    <span className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-transform", noRepeat ? 'translate-x-5' : 'translate-x-1')}></span>
                </button>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Background</span>
                <button onClick={() => setIsBgEnabled(!isBgEnabled)} className={cn("relative w-10 h-5 rounded-full transition-colors", isBgEnabled ? 'bg-green-400/50' : 'bg-white/20')}>
                    <span className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-transform", isBgEnabled ? 'translate-x-5' : 'translate-x-1')}></span>
                </button>
            </div>
        </div>
      )}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <button 
          onClick={handleGenerate}
          className="bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors text-2xl"
        >
          ✨
        </button>
      </div>
      <div className="absolute bottom-4 right-4 text-white/50 text-sm font-mono">
        Made with AI
      </div>
    </div>
  );
}
