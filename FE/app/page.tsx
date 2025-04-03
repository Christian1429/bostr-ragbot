'use client';

import React, { useState } from 'react';
import {
  handleChat,
  handleFileUpload,
  handleUrlLoad,
  handleTextLoad,
  handleMigration,
  chat,
} from '../utils/api';

function ApiComponent() {
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  const handleChatClick = async () => {
    try {
      const result = await chat(chatQuestion);
      setChatAnswer(result.answer);
    } catch (error) {
      console.error('Error chatting:', error);
      setChatAnswer('Error chatting');
    }
  };

  const handleMigrationClick = async () => {
    try {
      const result = await handleMigration();
      setMigrationResult(JSON.stringify(result));
    } catch (error) {
      console.error('Error migrating:', error);
      setMigrationResult('Error migrating');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUploadClick = async () => {
    if (file) {
      try {
        await handleFileUpload(file, 'pdf');
        alert('File uploaded successfully!');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file.');
      }
    }
  };

  const handleUrlLoadClick = async () => {
    try {
      await handleUrlLoad(url, 'url');
      alert('URL loaded successfully!');
    } catch (error) {
      console.error('Error loading URL:', error);
      alert('Error loading URL.');
    }
  };

  const handleTextLoadClick = async () => {
    try {
      await handleTextLoad(text, 'text');
      alert('Text loaded successfully!');
    } catch (error) {
      console.error('Error loading text:', error);
      alert('Error loading text.');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Chat */}
      <div className="border p-4 rounded-md shadow-md">
        <input
          type="text"
          value={chatQuestion}
          onChange={(e) => setChatQuestion(e.target.value)}
          placeholder="Enter your question"
        />
        <button
          className="bg-blue-500 text-white p-2 rounded-md mt-2"
           onClick={handleChatClick}
        >
          Chat
        </button>
        {chatAnswer && <p>Answer: {chatAnswer}</p>}
      </div>

      {/* Migrate Vectorstore */}
      <div className="border p-4 rounded-md shadow-md">
        <button
          className="bg-blue-500 text-white p-2 rounded-md mt-2"
          onClick={handleMigrationClick}
        >
          Migrate Vectorstore
        </button>
        {migrationResult && <p>Migration Result: {migrationResult}</p>}
      </div>

      {/* File Upload */}
      <div className="border p-4 rounded-md shadow-md">
        <input type="file" onChange={handleFileChange} />
        <button
          className="bg-blue-500 text-white p-2 rounded-md mt-2"
          onClick={handleFileUploadClick}
        >
          Upload File
        </button>
      </div>

      {/* URL Load */}
      <div className="border p-4 rounded-md shadow-md">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
        />
        <button
          className="bg-blue-500 text-white p-2 rounded-md mt-2"
          onClick={handleUrlLoadClick}
        >
          Load URL
        </button>
      </div>

      {/* Text Load */}
      <div className="border p-4 rounded-md shadow-md">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text"
        />
        <button
          className="bg-blue-500 text-white p-2 rounded-md mt-2"
          onClick={handleTextLoadClick}
        >
          Load Text
        </button>
      </div>
    </div>
  );
}

export default ApiComponent;
