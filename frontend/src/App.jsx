import React, { useState } from 'react';

export default function App() {
  const [chatInput, setChatInput] = useState('');
  const [chatResp, setChatResp] = useState('');

  const handleChat = async () => {
    const res = await fetch('http://localhost:8000/chat', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: chatInput })
    });
    const data = await res.json();
    setChatResp(data.response);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">AI Commerce Agent</h1>
      <div className="mt-4">
        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} className="border p-2 w-full" placeholder="Ask me..." />
        <button onClick={handleChat} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">Send</button>
      </div>
      <pre className="mt-4 p-2 bg-gray-100">{chatResp}</pre>
    </div>
  );
}
