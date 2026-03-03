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
          {practices.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-500 text-sm transition-colors"
            >
              清空全部
            </button>
          ) : (
            <div className="w-12"></div>
          )}
        </div>
      </div>

      {/* 列表 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {practices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">暂无练习记录</p>
            <Link to="/" className="text-primary hover:text-primary/80 mt-2 inline-block">
              开始第一次练习
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
