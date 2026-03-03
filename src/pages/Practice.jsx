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
                {practice.tips}
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
