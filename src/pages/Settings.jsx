import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(storage.getApiKey());
  }, []);

  const handleSave = () => {
    storage.setApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-medium text-gray-800 ml-4">设置</h1>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-gray-800 font-medium mb-4">通义千问 API Key</h2>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入你的 API Key"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />

          <button
            onClick={handleSave}
            className="mt-4 w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-colors"
          >
            {saved ? '已保存 ✓' : '保存'}
          </button>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
            <p className="font-medium text-gray-600 mb-2">如何获取 API Key：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>访问 <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">阿里云 DashScope 控制台</a></li>
              <li>登录/注册阿里云账号</li>
              <li>开通「通义千问」服务</li>
              <li>在「API-KEY 管理」中创建新的 API Key</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
