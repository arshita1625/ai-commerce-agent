import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:8000';
// const API = ''; // for production
export default function App() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi there 👋 I’m your personal AI Assistant. How can I help?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputFile) {
      const url = URL.createObjectURL(inputFile);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreview(null);
  }, [inputFile]);

  const addMessage = msg => setMessages(m => [...m, msg]);

  const handleSend = async () => {
    if (loading) return;
    const text = inputText.trim();
    if (!text && !inputFile) return;

    // Show user message
    if (text) addMessage({ from: 'user', text });
    else if (filePreview) addMessage({ from: 'user', fileURL: filePreview });

    setLoading(true);
    setInputText('');
    setInputFile(null);
    setFilePreview(null);

    try {
      if (inputFile) {
        const form = new FormData();
        form.append('file', inputFile);
        const { data } = await axios.post(
          `${API}/search-by-image`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        addMessage({ from: 'bot', imageResults: data.results });
      } else if (/recommend/i.test(text)) {
        const { data } = await axios.post(`${API}/recommend`, { message: text });
        addMessage({ from: 'bot', recResults: data.recommendations });
      } else {
        const { data } = await axios.post(`${API}/chat`, { message: text });
        addMessage({ from: 'bot', text: data.response });
      }
    } catch {
      addMessage({ from: 'bot', text: '❗ Sorry, something went wrong.' });
    }

    setLoading(false);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !loading) handleSend();
  };

  const handleFileChange = e => {
    setInputFile(e.target.files[0] || null);
  };

  return (
    <div className="app-container">
      <header className="header">Your Shopping AI Assistant</header>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`message-wrapper ${m.from}`}>
            {m.text && <div className={`bubble ${m.from}`}>{m.text}</div>}

            {/* User image preview in chat */}
            {m.fileURL && (
              <div className={`bubble ${m.from}`}>
                <img
                  src={m.fileURL}
                  alt="uploaded"
                  style={{
                    maxWidth: 160,
                    maxHeight: 160,
                    borderRadius: 12,
                    marginTop: 4,
                    border: '1px solid #ddd',
                  }}
                />
              </div>
            )}

            {/* Recommendation and image result cards */}
            {m.recResults && (
              <div className="rec-grid">
                {m.recResults.map(prod => (
                  <div key={prod.id} className="rec-card">
                    <img src={`${API}/${prod.image_path}`} alt={prod.name} />
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
                    <img src={`${API}/${prod.image_path}`} alt={prod.name} />
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
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        {filePreview && (
          <div
            style={{
              position: 'relative',
              width: 80,
              height: 80,
              marginRight: 12,
              marginLeft: 8,
            }}
          >
            <img
              src={filePreview}
              alt="preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 8,
                border: '1px solid #ddd',
              }}
            />
            <button
              onClick={() => {
                setInputFile(null);
                setFilePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                cursor: 'pointer',
                fontSize: 12,
                lineHeight: '20px',
                textAlign: 'center',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        )}
        <input
          type="text"
          className="text-input"
          placeholder="Type a message or upload an image…"
          value={inputText}
          onChange={e => {
            setInputText(e.target.value);
            setInputFile(null);
            setFilePreview(null);
          }}
          onKeyDown={handleKeyDown}
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
