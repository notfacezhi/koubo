import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';

const MODES = [
  { key: 'original', label: '原文对照' },
  { key: 'outline', label: '仅提纲' },
  { key: 'hint', label: '半提示' },
  { key: 'free', label: '完全脱稿' },
];

const MODE_COLORS = {
  original: '#8B5CF6',
  outline: '#EC4899',
  hint: '#F59E0B',
  free: '#10B981',
};

export function Stats() {
  const { id } = useParams();
  const [timerData, setTimerData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = storage.getTimerData(id);
    setTimerData(data);
  }, [id]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotalTime = () => {
    if (!timerData || !timerData.stages) return 0;
    return Object.values(timerData.stages || {}).reduce((sum, stage) => sum + (stage.totalTime || 0), 0);
  };

  const maxTime = calculateTotalTime();
  const totalSeconds = calculateTotalTime();

  // 计算百分比
  const getPercentage = (time) => maxTime > 0 ? Math.round((time / totalSeconds) * 100) : 0;

  // 生成 AI 分析
  const analyzePractice = async () => {
    if (!timerData) return;

    setLoading(true);
    try {
      const stagesData = MODES.map(mode => ({
        mode: mode.key,
        label: mode.label,
        seconds: timerData.stages[mode.key]?.totalTime || 0,
        percentage: getPercentage(timerData.stages[mode.key]?.totalTime || 0),
      }));

      const analysisPrompt = `请根据以下练习时间数据，分析用户的练习情况并给出改进建议：

练习时间数据（单位：秒）：
${stagesData.map(s => `${s.mode}(${s.label}): ${s.seconds}秒 (${s.percentage}%)`).join('\n')}

请分析：
1. 哪个阶段用时最长/最短？可能的原因是什么？
2. 用户在哪个阶段花时间最多？说明用户更依赖哪种形式的提示
3. 每个阶段的时间分配是否合理？应该增加还是减少某些阶段的时间？
4. 有没有任何明显异常（比如某阶段0秒）？

请以以下JSON格式输出：
{
  "summary": "简要总结用户练习情况（50字以内）",
  "insights": [
    "洞察1：描述（50字以内）",
    "洞察2：描述（50字以内）",
    "洞察3：描述（50字以内）"
  ],
  "suggestions": [
    "建议1：针对具体阶段的改进建议",
    "建议2：整体练习流程的建议"
  ]
}`;

      const result = await aiService.analyzeText(analysisPrompt);
      setAnalysis(result);
    } catch (err) {
      console.error('分析失败:', err);
      setAnalysis({
        summary: '分析功能暂时不可用，请检查API配置',
        insights: ['请先配置API Key'],
        suggestions: ['配置API Key后可使用此功能'],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!timerData) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="inline-flex items-center text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <div className="text-center py-12">
            <p className="text-gray-400">暂无练习数据</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      {/* 返回按钮 */}
      <div className="max-w-4xl mx-auto mb-6">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>
      </div>

      {/* 总览卡片 */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">练习总览</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-sm">总时长</p>
              <p className="text-3xl font-medium text-primary">{formatTime(totalSeconds)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">开始时间</p>
              <p className="text-lg">{formatDateTime(timerData.startTime)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">结束时间</p>
              <p className="text-lg">{formatDateTime(timerData.endTime)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">总阶段数</p>
              <p className="text-lg">4</p>
            </div>
          </div>
        </div>
      </div>

      {/* 时间分布 */}
      <div className="max-w-4xl mx-auto mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">时间分布</h3>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="space-y-4">
            {MODES.map((mode) => {
              const time = timerData.stages[mode.key]?.totalTime || 0;
              const percentage = getPercentage(time);
              return (
                <div key={mode.key} className="flex items-center gap-4">
                  <div className="flex-1">{mode.label}</div>
                  <div className="flex-1 flex-1">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: MODE_COLORS[mode.key],
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <p className="font-medium">{formatTime(time)}</p>
                    <p className="text-sm text-gray-400">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI 分析 */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-700">AI 分析</h3>
          <button
            onClick={analyzePractice}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? '分析中...' : '生成分析'}
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">正在分析您的练习数据...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">📊 总结</h4>
                <p className="text-gray-600">{analysis.summary}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">💡 洞察</h4>
                <ul className="space-y-2">
                  {analysis.insights?.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <span className="text-primary">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">🎯 改进建议</h4>
                <ul className="space-y-2">
                  {analysis.suggestions?.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <span className="text-primary">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              点击「生成分析」获取AI建议
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
