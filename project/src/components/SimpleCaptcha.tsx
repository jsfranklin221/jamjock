import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  onChange: (value: string) => void;
}

export default function SimpleCaptcha({ onChange }: SimpleCaptchaProps) {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    onChange('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);
    onChange(value === captchaText ? captchaText : '');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-2xl tracking-wider text-gray-800 select-none">
            {captchaText}
          </div>
          <button
            type="button"
            onClick={generateCaptcha}
            className="text-blue-600 hover:text-blue-700"
            aria-label="Refresh captcha"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Enter the code above"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={6}
        />
      </div>
    </div>
  );
}