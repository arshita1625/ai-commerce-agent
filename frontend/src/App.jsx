import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [chatInput, setChatInput] = useState('');
  const [chatResp, setChatResp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:8000/chat', {
        message: chatInput
      });
      console.log("data", data);
      setChatResp(data.response);
    } catch (err) {
      console.error(err);
      setChatResp('Error: could not reach backend.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>AI Commerce Agent</h1>
      <input
        type="text"
        value={chatInput}
        onChange={e => setChatInput(e.target.value)}
        placeholder="Ask me anything…"
        style={{
          width: '100%',
          padding: '0.5rem',
          margin: '1rem 0',
          boxSizing: 'border-box'
        }}
      />
      <button
        onClick={handleChat}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.5rem',
          background: '#2563EB',
          color: 'white',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Thinking…' : 'Send'}
      </button>
      {chatResp && (
        <pre style={{
          background: '#f3f4f6',
          padding: '1rem',
          marginTop: '1rem',
          whiteSpace: 'pre-wrap'
        }}>
          {chatResp}
        </pre>
      )}
    </div>
  );
}
