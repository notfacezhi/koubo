# 口播脱稿练习工具 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个帮助用户从"死记硬背"转变为"理解核心、自主复述"的口播训练工具。

**Architecture:** React SPA + Tailwind CSS，使用 localStorage 存储历史记录，通义千问 API 进行文稿拆解，MediaRecorder API 实现录音功能。

**Tech Stack:** React 18, Vite, Tailwind CSS, React Router v6, 通义千问 API, MediaRecorder API

---

## Task 1: 环境搭建 - 创建 Vite + React 项目

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`

**Step 1: 检查 Node.js 环境**

Run: `node --version && npm --version`
Expected: Node.js >= 18.0.0, npm >= 9.0.0

**Step 2: 初始化 Vite 项目**

Run: `cd D:\application\code\koubo && npm create vite@latest . -- --template react`
Expected: 创建 Vite React 项目结构

**Step 3: 安装核心依赖**

Run: `npm install react-router-dom@6`
Expected: 安装 React Router

**Step 4: 验证项目启动**

Run: `npm run dev`
Expected: 开发服务器启动在 http://localhost:5173

**Step 5: 停止开发服务器**

按 Ctrl+C 停止服务器

---

## Task 2: 配置 Tailwind CSS

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css`

**Step 1: 安装 Tailwind CSS**

Run: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
Expected: 创建 tailwind.config.js 和 postcss.config.js

**Step 2: 配置 tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',
      },
    },
  },
  plugins: [],
}
```

**Step 3: 创建 src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-800;
}
```

**Step 4: 在 main.jsx 中导入 CSS**

修改 `src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 5: 验证 Tailwind 生效**

修改 `src/App.jsx`:

```jsx
function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-3xl font-medium text-primary">口播脱稿练习</h1>
    </div>
  )
}

export default App
```

Run: `npm run dev`
Expected: 页面显示紫色"口播脱稿练习"文字

**Step 6: 提交**

```bash
git add .
git commit -m "chore: setup vite + react + tailwindcss"
```

---

## Task 3: 创建目录结构和配置文件

**Files:**
- Create: `src/config/ai.config.js`
- Create: `src/hooks/useLocalStorage.js`
- Create: `src/hooks/useAudioRecorder.js`
- Create: `src/services/ai.js`
- Create: `src/services/storage.js`

**Step 1: 创建目录结构**

Run:
```bash
mkdir -p src/config src/hooks src/services src/components src/pages
```

**Step 2: 创建 AI 配置文件 `src/config/ai.config.js`**

```javascript
export const AI_CONFIG = {
  provider: 'qwen',
  endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  model: 'qwen-turbo',
};

export const AI_PROMPT = `你是一个口播训练助手。请将用户输入的文稿拆解为以下结构：

1. 核心主旨（1句话，不超过30字）
2. 关键要点（3-6条，每条不超过20字，按原文顺序）
3. 口播复述提示（1-2句简单提示）

规则：
- 不润色、不扩写、不文艺化
- 不增加原文没有的信息
- 要点短句化、口语化
- 严格保留原文顺序

请以JSON格式输出：
{
  "mainIdea": "核心主旨",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "tips": "复述提示"
}`;
```

**Step 3: 创建存储服务 `src/services/storage.js`**

```javascript
const STORAGE_KEYS = {
  PRACTICE_LIST: 'koubo_practice_list',
  API_KEY: 'koubo_api_key',
};

export const storage = {
  // 获取所有练习记录
  getPracticeList() {
    const data = localStorage.getItem(STORAGE_KEYS.PRACTICE_LIST);
    return data ? JSON.parse(data) : [];
  },

  // 保存练习记录
  savePractice(item) {
    const list = this.getPracticeList();
    const existingIndex = list.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }
    // 最多保存20条
    const trimmedList = list.slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_LIST, JSON.stringify(trimmedList));
    return item;
  },

  // 获取单条练习记录
  getPractice(id) {
    const list = this.getPracticeList();
    return list.find(i => i.id === id);
  },

  // 删除练习记录
  deletePractice(id) {
    const list = this.getPracticeList();
    const filtered = list.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_LIST, JSON.stringify(filtered));
  },

  // 清空所有记录
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.PRACTICE_LIST);
  },

  // API Key 管理
  getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },

  setApiKey(key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  },
};
```

**Step 4: 创建 AI 服务 `src/services/ai.js`**

```javascript
import { AI_CONFIG, AI_PROMPT } from '../config/ai.config';
import { storage } from './storage';

export const aiService = {
  async analyzeText(text) {
    const apiKey = storage.getApiKey();
    if (!apiKey) {
      throw new Error('请先在设置页面配置 API Key');
    }

    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: AI_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'AI 请求失败');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 解析 JSON 响应
    try {
      // 尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法解析 AI 响应');
    } catch (e) {
      throw new Error('AI 返回格式错误，请重试');
    }
  },
};
```

**Step 5: 创建 useLocalStorage Hook `src/hooks/useLocalStorage.js`**

```javascript
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

**Step 6: 创建 useAudioRecorder Hook `src/hooks/useAudioRecorder.js`**

```javascript
import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);

      // 开始计时
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('录音失败:', err);
      alert('无法访问麦克风，请检查权限设置');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
  }, [audioUrl]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    audioUrl,
    duration,
    formattedDuration: formatDuration(duration),
    startRecording,
    stopRecording,
    resetRecording,
  };
}
```

**Step 7: 提交**

```bash
git add .
git commit -m "feat: add config, services and hooks"
```

---

## Task 4: 创建通用组件

**Files:**
- Create: `src/components/LoadingSpinner.jsx`
- Create: `src/components/Toast.jsx`

**Step 1: 创建 LoadingSpinner 组件 `src/components/LoadingSpinner.jsx`**

```jsx
export function LoadingSpinner({ text = '加载中...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500">{text}</p>
    </div>
  );
}
```

**Step 2: 创建 Toast 组件 `src/components/Toast.jsx`**

```jsx
import { useEffect } from 'react';

export function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-gray-800';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-50`}>
      {message}
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add .
git commit -m "feat: add LoadingSpinner and Toast components"
```

---

## Task 5: 创建首页 (Home)

**Files:**
- Create: `src/pages/Home.jsx`

**Step 1: 创建首页组件 `src/pages/Home.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const recentPractices = storage.getPracticeList().slice(0, 2);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('请输入练习文稿');
      return;
    }

    if (text.length < 50) {
      setError('文稿至少需要50字');
      return;
    }

    if (text.length > 1000) {
      setError('文稿不能超过1000字');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await aiService.analyzeText(text);
      const practiceItem = {
        id: Date.now().toString(),
        originalText: text,
        mainIdea: result.mainIdea,
        keyPoints: result.keyPoints,
        tips: result.tips,
        createdAt: Date.now(),
      };
      storage.savePractice(practiceItem);
      navigate(`/practice/${practiceItem.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text, length = 15) => {
    return text.length > length ? text.slice(0, length) + '...' : text;
  };

  if (loading) {
    return <LoadingSpinner text="AI 正在拆解文稿..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      {/* 设置入口 */}
      <div className="max-w-2xl mx-auto flex justify-end mb-4">
        <Link to="/settings" className="text-gray-400 hover:text-primary transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>

      {/* 主卡片 */}
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-800 mb-2">口播脱稿练习</h1>
          <p className="text-gray-500">帮你抓住重点，自然表达</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴你需要练习的口播文稿...&#10;&#10;建议 50-1000 字，AI 会帮你拆解出核心要点"
            className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700 placeholder:text-gray-400"
          />

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-400">{text.length} / 1000 字</span>
            <button
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              生成提纲 & 开始练习
            </button>
          </div>
        </div>

        {/* 最近练习 */}
        {recentPractices.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm text-gray-400 mb-4">最近练习</h2>
            <div className="grid grid-cols-2 gap-4">
              {recentPractices.map((item) => (
                <Link
                  key={item.id}
                  to={`/practice/${item.id}`}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <p className="text-gray-700 font-medium mb-2">
                    {truncateText(item.originalText)}
                  </p>
                  <p className="text-sm text-gray-400">{formatDate(item.createdAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 历史入口 */}
        {storage.getPracticeList().length > 0 && (
          <div className="text-center mt-6">
            <Link to="/history" className="text-primary hover:text-primary/80 text-sm">
              查看全部历史记录 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add Home page"
```

---

## Task 6: 创建练习页 (Practice)

**Files:**
- Create: `src/pages/Practice.jsx`
- Create: `src/components/AudioRecorder.jsx`

**Step 1: 创建 AudioRecorder 组件 `src/components/AudioRecorder.jsx`**

```jsx
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export function AudioRecorder() {
  const {
    isRecording,
    audioUrl,
    formattedDuration,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
        {/* 录音按钮 */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 animate-pulse'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isRecording ? (
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>

        {/* 时长显示 */}
        <span className="text-gray-500 font-mono text-lg w-16">
          {formattedDuration}
        </span>

        {/* 播放/重录按钮 */}
        {audioUrl && (
          <>
            <audio src={audioUrl} controls className="h-10" />
            <button
              onClick={resetRecording}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: 创建练习页组件 `src/pages/Practice.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { AudioRecorder } from '../components/AudioRecorder';

const MODES = [
  { key: 'original', label: '原文对照' },
  { key: 'outline', label: '仅提纲' },
  { key: 'hint', label: '半提示' },
  { key: 'free', label: '完全脱稿' },
];

export function Practice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [practice, setPractice] = useState(null);
  const [mode, setMode] = useState('outline');

  useEffect(() => {
    const item = storage.getPractice(id);
    if (item) {
      setPractice(item);
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  if (!practice) {
    return null;
  }

  // 半提示模式：每句只显示首词
  const getHintText = (text) => {
    const sentences = text.split(/[。！？，、]/g).filter(s => s.trim());
    return sentences.map(s => {
      const words = s.trim().split(/\s+/);
      if (words.length === 0) return '';
      return words[0] + '...';
    }).join(' / ');
  };

  const renderContent = () => {
    switch (mode) {
      case 'original':
        return (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm text-gray-400 mb-2">原文</h3>
              <div className="bg-gray-50 rounded-xl p-4 text-gray-700 leading-relaxed">
                {practice.originalText}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-gray-400 mb-2">AI 提纲</h3>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-primary font-medium">{practice.mainIdea}</p>
                </div>
                <ul className="space-y-2">
                  {practice.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 'outline':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-primary/5 rounded-2xl p-6 mb-6">
              <p className="text-xl text-primary font-medium text-center">
                {practice.mainIdea}
              </p>
            </div>
            <ul className="space-y-4">
              {practice.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 text-lg pt-1">{point}</span>
                </li>
              ))}
            </ul>
            {practice.tips && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl text-gray-500 text-sm">
                💡 {practice.tips}
              </div>
            )}
          </div>
        );

      case 'hint':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-gray-600 leading-loose">
                {getHintText(practice.originalText)}
              </p>
            </div>
            <p className="text-center text-gray-400 mt-4 text-sm">
              根据关键词提示，尝试复述完整内容
            </p>
          </div>
        );

      case 'free':
        return (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">尝试脱稿复述</p>
            <p className="text-gray-300 text-sm mt-2">点击下方按钮开始录音</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  mode === m.key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {renderContent()}
      </div>

      {/* 底部录音栏 */}
      <AudioRecorder />
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add .
git commit -m "feat: add Practice page with 4 modes and AudioRecorder"
```

---

## Task 7: 创建历史页 (History)

**Files:**
- Create: `src/pages/History.jsx`

**Step 1: 创建历史页组件 `src/pages/History.jsx`**

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';

export function History() {
  const [practices, setPractices] = useState(storage.getPracticeList());

  const handleDelete = (id) => {
    if (confirm('确定要删除这条记录吗？')) {
      storage.deletePractice(id);
      setPractices(storage.getPracticeList());
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有记录吗？')) {
      storage.clearAll();
      setPractices([]);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text, length = 30) => {
    return text.length > length ? text.slice(0, length) + '...' : text;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-medium text-gray-800">历史记录</h1>
          {practices.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-500 text-sm transition-colors"
            >
              清空全部
            </button>
          )}
        </div>
      </div>

      {/* 列表 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {practices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">暂无练习记录</p>
            <Link to="/" className="text-primary hover:text-primary/80 mt-2 inline-block">
              开始第一次练习 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {practices.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 shadow-sm flex items-start justify-between gap-4"
              >
                <Link
                  to={`/practice/${item.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-gray-700 font-medium truncate">
                    {truncateText(item.originalText)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{formatDate(item.createdAt)}</p>
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add History page"
```

---

## Task 8: 创建设置页 (Settings)

**Files:**
- Create: `src/pages/Settings.jsx`

**Step 1: 创建设置页组件 `src/pages/Settings.jsx`**

```jsx
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
```

**Step 2: 提交**

```bash
git add .
git commit -m "feat: add Settings page for API Key configuration"
```

---

## Task 9: 配置路由和 App 入口

**Files:**
- Modify: `src/App.jsx`

**Step 1: 更新 App.jsx 配置路由**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Practice } from './pages/Practice';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice/:id" element={<Practice />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 2: 验证应用运行**

Run: `npm run dev`
Expected: 访问 http://localhost:5173 显示首页

**Step 3: 提交**

```bash
git add .
git commit -m "feat: configure routes and complete app structure"
```

---

## Task 10: 最终验证和清理

**Step 1: 运行开发服务器**

Run: `npm run dev`

**Step 2: 手动测试流程**

1. 访问 http://localhost:5173
2. 点击设置，输入 API Key（需要有效的通义千问 API Key）
3. 返回首页，输入一段测试文稿
4. 点击"生成提纲 & 开始练习"
5. 验证 4 种模式切换
6. 测试录音功能
7. 返回首页，查看历史记录
8. 访问历史页，测试删除功能

**Step 3: 构建生产版本**

Run: `npm run build`
Expected: 生成 dist 目录

**Step 4: 最终提交**

```bash
git add .
git commit -m "feat: complete koubo practice tool v1.0"
```

---

## 执行方式

**Plan complete and saved to `docs/plans/2026-03-03-koubo-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
