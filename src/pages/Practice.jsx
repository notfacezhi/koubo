import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { AudioRecorder } from '../components/AudioRecorder';

const MODES = [
  { key: 'original', label: '原文对照' },
  { key: 'outline', label: '仅提纲' },
  { key: 'hint', label: '半提示' },
  { key: 'free', label: '完全脱稿' },
];

const MODE_COLORS = {
  original: '#8B5CF6',
  outline: '#10B981',
  hint: '#F59E0B',
  free: '#3B82F6',
};

export function Practice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [practice, setPractice] = useState(null);
  const [mode, setMode] = useState('original');

  // 计时状态
  const [timerState, setTimerState] = useState('idle'); // idle, running, paused
  const [elapsedTime, setElapsedTime] = useState(0); // 总秒数
  const [displayTime, setDisplayTime] = useState('00:00');

  // 各阶段数据
  const [stageTimes, setStageTimes] = useState({
    original: { current: 0, total: 0, active: false },
    outline: { current: 0, total: 0, active: false },
    hint: { current: 0, total: 0, active: false },
    free: { current: 0, total: 0, active: false },
  });

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const stageStartTimeRef = useRef(null);

  // 获取练习数据
  useEffect(() => {
    const item = storage.getPractice(id);
    if (item) {
      setPractice(item);
      // 加载已有的计时数据
      const timerData = storage.getTimerData(id);
      if (timerData && timerData.endTime) {
        setElapsedTime(timerData.totalSeconds || 0);
        setTimerState('finished');
        setStageTimes(timerData.stages || {
          original: { current: 0, total: 0, active: false },
          outline: { current: 0, total: 0, active: false },
          hint: { current: 0, total: 0, active: false },
          free: { current: 0, total: 0, active: false },
        });
      }
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  // 格式化时间
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 更新显示时间
  useEffect(() => {
    setDisplayTime(formatTime(elapsedTime));
  }, [elapsedTime, formatTime]);

  // 核心计时时器
  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    const startTime = Date.now();
    startTimeRef.current = startTime;
    stageStartTimeRef.current = startTime;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000) + elapsedTime;
      setElapsedTime(elapsed);

      // 更新当前阶段的时间
      setStageTimes(prev => {
        const newStages = { ...prev };
        Object.keys(newStages).forEach(key => {
          if (newStages[key].active) {
            newStages[key] = {
              ...newStages[key],
              current: Math.floor((now - stageStartTimeRef.current) / 1000),
            };
          }
        });
        return newStages;
      });
    }, 1000);

    setTimerState('running');
  }, [elapsedTime]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setTimerState('paused');
    }
  }, []);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    const lastElapsed = elapsedTime;
    startTimeRef.current = now - (lastElapsed * 1000);
    startTimer();
  }, [elapsedTime, startTimer]);

  const stopTimer = useCallback(() => {
    pauseTimer();
    setTimerState('finished');

    // 保存计时数据
    const finalStageTimes = { ...stageTimes };
    Object.keys(finalStageTimes).forEach(key => {
      finalStageTimes[key] = {
        current: 0,
        total: finalStageTimes[key].total + finalStageTimes[key].current,
        active: false,
      };
    });

    const timerData = {
      startTime: startTimeRef.current || Date.now(),
      endTime: Date.now(),
      totalSeconds: elapsedTime,
      stages: finalStageTimes,
    };

    storage.saveTimerData(id, timerData);
  }, [stageTimes, elapsedTime, id]);

  // 切换模式时自动处理计时时
  const handleModeChange = useCallback((newMode) => {
    if (timerState === 'finished') return; // 已结束后不处理

    setMode(newMode);

    // 停止当前阶段
    if (stageTimes[mode].active) {
      setStageTimes(prev => {
        const newStages = { ...prev };
        newStages[mode] = {
          ...newStages[mode],
          active: false,
          total: newStages[mode].total + newStages[mode].current,
        };
        return newStages;
      });
    }

    // 开始新阶段
    if (timerState === 'running') {
      setStageTimes(prev => {
        const newStages = { ...prev };
        newStages[newMode] = {
          ...newStages[newMode],
          active: true,
          current: 0,
          total: newStages[newMode].total,
        };
        stageStartTimeRef.current = Date.now();
        return newStages;
      });
    }
  }, [mode, timerState, stageTimes]);

  // 半提示模式：每句只显示首字
  const getHintText = (text) => {
    const sentences = text.split(/[。！？，、]/g).filter(s => s.trim());
    return sentences.map(s => {
      const words = s.trim().split(/\s+/);
      if (words.length === 0) return '';
      return words[0] + '...';
    }).join(' / ');
  };

  if (!practice) return null;

  const handleStart = () => {
    startTimer();
    setStageTimes({
      original: { current: 0, total: 0, active: timerState === 'running' && mode === 'original' },
      outline: { current: 0, total: 0, active: timerState === 'running' && mode === 'outline' },
      hint: { current: 0, total: 0, active: timerState === 'running' && mode === 'hint' },
      free: { current: 0, total: 0, active: timerState === 'running' && mode === 'free' },
    });
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  const handleEnd = () => {
    stopTimer();
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
              <p className="text-gray-600 leading-loose text-center">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7 7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3 3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 顶部控制栏 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* 计时器状态指示 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStart}
                disabled={timerState === 'running'}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timerState === 'running'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : timerState === 'idle'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {timerState === 'idle' ? '开始' : timerState === 'running' ? '进行中' : '继续'}
              </button>

              <div className={`text-2xl font-mono font-bold ${
                timerState === 'running' ? 'text-primary' : timerState === 'paused' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {displayTime}
              </div>

              {timerState === 'running' ? (
                <button
                  onClick={handlePause}
                  className="px-3 py-1.5 rounded-lg text-sm bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                >
                  暂停
                </button>
              ) : timerState === 'paused' ? (
                <button
                  onClick={handleResume}
                  className="px-3 py-1.5 rounded-lg text-sm bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  继续
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {timerState !== 'finished' && (
              <button
                onClick={handleEnd}
                className="px-4 py-1.5 rounded-lg text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                结束
              </button>
            )}

            <Link to={`/stats/${id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
              查看统计
            </Link>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
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

      {/* 阶段进度条 */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-4 gap-4">
          {MODES.map((m) => {
            const isActive = stageTimes[m.key].active;
            const totalTime = stageTimes[m.key].total;
            const currentTime = stageTimes[m.key].current;
            const maxStageTime = Math.max(
              ...Object.values(stageTimes).map(s => s.total)
            ) || 1;
            const barWidth = maxStageTime > 0 ? (totalTime / maxStageTime) * 100 : 0;

            return (
              <div key={m.key} className="flex flex-col items-center gap-2">
                <div className="flex-1 text-sm text-gray-500 whitespace-nowrap">
                  {m.label}
                </div>
                <div className="flex-1 flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                    {/* 进度条背景 */}
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: MODE_COLORS[m.key],
                      }}
                    ></div>
                    {/* 当前指示器 */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-0 h-full w-0.5 bg-gray-400 rounded-full animate-pulse"
                      ></div>
                    )}
                  </div>
                </div>
                <div className="w-20 text-right">
                  <p className="text-sm font-medium">{formatTime(currentTime)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-6 min-h-[400px]">
        {renderContent()}
      </div>

      {/* 底部录音栏 */}
      <AudioRecorder />
    </div>
  );
}
