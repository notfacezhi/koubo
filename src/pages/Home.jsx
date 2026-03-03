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
              查看全部历史记录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
