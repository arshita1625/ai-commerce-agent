import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:8000';

export default function App() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi there 👋 I’m your personal AI Assistant. How can I help?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = msg => {
    setMessages(m => [...m, msg]);
  };

  const handleSend = async () => {
    if (loading) return;
    const text = inputText.trim();
    if (!text && !inputFile) return;

    // show user bubble
    if (text) addMessage({ from: 'user', text });
    else if (inputFile) addMessage({ from: 'user', text: '[Image]' });

    setLoading(true);
    setInputText('');
    setInputFile(null);

    try {
      // Image search
      if (inputFile) {
        const form = new FormData();
        form.append('file', inputFile);
        const { data } = await axios.post(
          `${API}/search-by-image`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        addMessage({ from: 'bot', imageResults: data.results });
      }
      // Recommendation
      else if (/^recommend/i.test(text)) {
        const { data } = await axios.post(`${API}/recommend`, { message: text });
        addMessage({ from: 'bot', recResults: data.recommendations });
      }
      // Fallback chat
      else {
        const { data } = await axios.post(`${API}/chat`, { message: text });
        addMessage({ from: 'bot', text: data.response });
      }
    } catch {
      addMessage({ from: 'bot', text: '❗ Sorry, something went wrong.' });
    }

    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="header">Your Shooping AI Assistant</header>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message-wrapper ${m.from}`}
          >
            {m.text && (
              <div className={`bubble ${m.from}`}>
                {m.text}
              </div>
            )}

            {m.recResults && (
              <div className="rec-grid">
                {m.recResults.map(prod => (
                  <div key={prod.id} className="rec-card">
                    <img
                      src={`${API}/${prod.image_path}`}
                      alt={prod.name}
                    />
                    <div className="name">{prod.name}</div>
                    <div className="desc">{prod.description}</div>
                  </div>
                ))}
              </div>
            )}

            {m.imageResults && (
              <div className="rec-grid">
                {m.imageResults.map(prod => (
                  <div key={prod.id} className="rec-card">
                    <img
                      src={`${API}/${prod.image_path}`}
                      alt={prod.name}
                    />
                    <div className="name">{prod.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-bar">
        <label className="upload-button">
          📷
          <input
            type="file"
            accept="image/*"
            onChange={e => setInputFile(e.target.files[0] || null)}
          />
        </label>

        <input
          type="text"
          className="text-input"
          placeholder="Ask something (e.g. “Recommend me a lipstick”) or upload an image..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />

        <button
          onClick={handleSend}
          disabled={loading && !inputFile}
          className={`send-button ${loading ? 'disabled' : ''}`}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
