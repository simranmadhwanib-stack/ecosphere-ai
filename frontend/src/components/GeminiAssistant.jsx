import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, AlertTriangle, FileText, Trees, Zap } from 'lucide-react';

export default function GeminiAssistant({ apiBase }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `### Welcome to EcoSphere AI Decision Intelligence! 🌍
I am your **Gemini ESG Assistant**. I analyze real-time environmental datasets, IoT sensor readings, and predictive ML forecasts to help optimize community resource usage.

**Ask me questions about municipal sustainability, such as:**
*   "Show the status of our electricity consumption."
*   "Are there any water leaks active?"
*   "Which areas require more tree plantation?"
*   "Generate an executive sustainability report."
`,
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Automatically scroll chat container to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message to state
    const userMsg = {
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.message,
          time: new Date().toLocaleTimeString()
        }]);
      } else {
        throw new Error('API communication error');
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `### 🚨 Offline Mode Alert
I failed to connect to the backend server at \`${apiBase}\`. 

Please make sure the backend is active by running \`node server.js\` in the backend folder.`,
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Convert custom bold and list markdowns in mock messages into beautiful elements
  const renderMessageText = (text) => {
    return text.split('\n').map((line, i) => {
      // Heading 1
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">{line.replace('# ', '')}</h1>;
      }
      // Heading 2
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.replace('## ', '')}</h2>;
      }
      // Heading 3
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-sm font-extrabold text-eco-400 mt-2 mb-1 tracking-wide uppercase">{line.replace('### ', '')}</h3>;
      }
      // Bullet lists
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const itemText = line.replace(/^[\*\-]\s+/, '');
        return (
          <li key={i} className="ml-4 list-disc text-slate-300 text-xs py-0.5">
            {parseInlineStyles(itemText)}
          </li>
        );
      }
      // Ordered lists
      if (/^\d+\.\s+/.test(line)) {
        const itemText = line.replace(/^\d+\.\s+/, '');
        const number = line.match(/^\d+/)[0];
        return (
          <li key={i} className="ml-4 list-decimal text-slate-300 text-xs py-0.5">
            {parseInlineStyles(itemText)}
          </li>
        );
      }
      // Standard Paragraph
      return line.trim() ? <p key={i} className="text-slate-300 text-xs leading-relaxed my-1.5">{parseInlineStyles(line)}</p> : <div key={i} className="h-2"></div>;
    });
  };

  // Replace **text** with bold tags and `code` with styling
  const parseInlineStyles = (line) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;
    
    let parts = [];
    let lastIndex = 0;
    
    // We do simple token parsing
    const textSegments = [];
    let match;
    
    // A simplified replacement logic
    let cleanLine = line;
    // Replace markdown tags with custom splits
    const formatted = [];
    let remaining = line;
    
    // Quick regex inline substitution
    const tokens = remaining.split(/(\*\*.*?\*\*|`.*?`)/);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={idx} className="text-white font-semibold">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return <code key={idx} className="bg-slate-950 px-1.5 py-0.5 rounded text-eco-400 font-mono text-[10px]">{token.slice(1, -1)}</code>;
      }
      return token;
    });
  };

  const samplePrompts = [
    { text: "What is the status of our electricity consumption?", icon: <Zap className="w-3.5 h-3.5 text-blue-400" /> },
    { text: "Are there any water leaks active?", icon: <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" /> },
    { text: "Which areas require more tree plantation?", icon: <Trees className="w-3.5 h-3.5 text-eco-400" /> },
    { text: "Generate a monthly sustainability report.", icon: <FileText className="w-3.5 h-3.5 text-orange-400" /> }
  ];

  return (
    <div className="glass-panel p-6 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* Assistant Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-eco-500/10 flex items-center justify-center border border-eco-500/20 text-eco-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
              Gemini AI Sustainability Agent
            </h2>
            <p className="text-xs text-slate-400">Decision Intelligence Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-eco-500 animate-ping"></span>
          <span className="text-[10px] text-eco-400 font-mono font-bold tracking-widest uppercase">Vertex API Live</span>
        </div>
      </div>

      {/* Message Output Thread */}
      <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 border transition-all ${
              msg.sender === 'user' 
                ? 'bg-eco-500/15 border-eco-500/30 text-slate-200 rounded-tr-none' 
                : 'bg-slate-900/60 border-white/5 rounded-tl-none shadow-glass-glow'
            }`}>
              {/* Message text */}
              <div className="space-y-1">
                {msg.sender === 'user' ? (
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                ) : (
                  renderMessageText(msg.text)
                )}
              </div>
              
              {/* Message Footer Time */}
              <div className="text-[9px] text-slate-500 text-right mt-2 font-mono">
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-eco-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Gemini is processing smart grid telemetry...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Clickable Sample Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt.text)}
            className="p-2.5 bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-eco-500/30 rounded-xl text-left text-[11px] text-slate-400 hover:text-white transition-all flex items-start gap-2 h-full"
          >
            <div className="mt-0.5 shrink-0">{prompt.icon}</div>
            <span className="leading-snug">{prompt.text}</span>
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-white/10"
      >
        <div className="pl-3 text-slate-500">
          <MessageSquare className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Gemini about resource leakages, solar grids, AQI, carbon footprint forecasts..."
          className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-200 placeholder-slate-500 py-2.5 px-1 focus:ring-0 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className={`p-2.5 rounded-lg transition-all ${
            inputText.trim() && !loading
              ? 'bg-eco-500 text-white shadow-neon-green cursor-pointer'
              : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
