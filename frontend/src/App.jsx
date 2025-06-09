import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [chatInput, setChatInput] = useState('');
  const [chatResp, setChatResp] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageResults, setImageResults] = useState([]);
  const [recResults, setRecResults] = useState([]);
  const API = 'http://localhost:8000';
  // const handleChat = async () => {
  //   if (!chatInput.trim()) return;
  //   setLoading(true);
  //   try {
  //     const { data } = await axios.post('http://localhost:8000/chat', {
  //       message: chatInput
  //     });
  //     console.log("data", data);
  //     setChatResp(data.response);
  //   } catch (err) {
  //     console.error(err);
  //     setChatResp('Error: could not reach backend.');
  //   }
  //   setLoading(false);
  // };
  const handleChat = async () => {
    if (!chatInput.trim()) return;
    setLoading(true);

    setChatResp('');
    setRecResults([]);          // ← clear previous recs

    try {
      // if user asked something like "Recommend me a t-shirt for sports"
      if (/^recommend/i.test(chatInput.trim())) {
        const { data } = await axios.post(
          'http://localhost:8000/recommend',
          { message: chatInput }
        );
        setRecResults(data.recommendations);
      } else {
        // fallback to normal chat
        const { data } = await axios.post(
          'http://localhost:8000/chat',
          { message: chatInput }
        );
        setChatResp(data.response);
      }
    } catch (err) {
      console.error(err);
      setChatResp('Error: could not reach backend.');
    }
    setLoading(false);
  };
  const handleImageChange = e => {
    setImageFile(e.target.files[0] || null);
    setImageResults([]);           // clear prior results
  };

  const handleImageSearch = async () => {
    if (!imageFile) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', imageFile);
      const { data } = await axios.post(
        'http://localhost:8000/search-by-image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setImageResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };
  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', fontFamily: 'sans-serif' }}>
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
      {/* Image-Based Product Search */}
      <div style={{ marginTop: 40 }}>
        <h2>Search by Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'block', margin: '1rem 0' }}
        />
        <button
          onClick={handleImageSearch}
          disabled={!imageFile || loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#10B981',
            color: 'white',
            border: 'none',
            cursor: imageFile ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Searching…' : 'Search by Image'}
        </button>

        {/* Results */}
        {console.log("image", imageResults)}

        {imageResults.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            {imageResults.map((prod, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem'
                }}
              >
                <img
                  src={`${API}/${prod.image_path}`}
                  alt={prod.name}
                  style={{ width: 60, height: 60, objectFit: 'cover', marginRight: '1rem' }}
                />
                <div>
                  <strong>{prod.name}</strong>
                  <div style={{ fontSize: '.9rem', color: '#4B5563' }}>
                    {prod.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
        }
      </div >
      {/* LLM response (for non-recommend queries) */}
      {chatResp && (
        <pre className="mt-4 p-2 bg-gray-100">{chatResp}</pre>
      )}

      {/* Catalog‐based recommendations */}
      {recResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Recommendations</h2>
          {console.log("res", recResults)}
          {recResults.map((prod, idx) => (
            <div
              key={`${prod.id}-${idx}`}
              className="flex items-center mb-4 p-2 border rounded"
            >
              <img
                src={`http://localhost:8000/${prod.image_path}`}
                alt={prod.name}
                className="w-16 h-16 object-cover mr-4"
              />
              <div>
                <div className="font-medium">{prod.name}</div>
                <div className="text-sm text-gray-600">{prod.description}</div>
                <div className="text-sm text-gray-600">{prod.price}</div>
              </div>
            </div>
          ))}
        </div>
      )
      }
    </div>
  );
}
