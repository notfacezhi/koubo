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
  original: '#A78BFA',  // 温和紫色
  outline: '#34D399',   // 温和绿色
  hint: '#FBBF24',      // 温和黄色
  free: '#60A5FA',      // 温和蓝色
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
      if (timerData) {
        setElapsedTime(timerData.totalSeconds || 0);
        if (timerData.endTime) {
          setTimerState('finished');
        }
        // 恢复各阶段的累积时间
        if (timerData.stages) {
          const restoredStages = {};
          Object.keys(timerData.stages).forEach(key => {
            restoredStages[key] = {
              current: timerData.stages[key].current || 0,
              total: timerData.stages[key].total || 0,
              active: timerData.stages[key].active || false,
            };
          });
          setStageTimes(restoredStages);
        }
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
            const elapsedInStage = Math.floor((now - stageStartTimeRef.current) / 1000);
            newStages[key] = {
              ...newStages[key],
              current: newStages[key].current + 1,
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
      
      // 暂停时保存当前数据
      const timerData = {
        startTime: startTimeRef.current || Date.now(),
        endTime: null,
        totalSeconds: elapsedTime,
        stages: stageTimes,
      };
      storage.saveTimerData(id, timerData);
    }
  }, [elapsedTime, stageTimes, id]);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    const lastElapsed = elapsedTime;
    startTimeRef.current = now - (lastElapsed * 1000);
    startTimer();
  }, [elapsedTime, startTimer]);

  const stopTimer = useCallback(() => {
    pauseTimer();
    setTimerState('finished');

    // 保存计时数据（保留current值，不清零）
    const finalStageTimes = {};
    Object.keys(stageTimes).forEach(key => {
      finalStageTimes[key] = {
        current: stageTimes[key].current,
        total: stageTimes[key].total,
        totalTime: stageTimes[key].total + stageTimes[key].current,
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
  }, [stageTimes, elapsedTime, id, pauseTimer]);

  // 切换模式时自动处理计时时
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);

    // 如果已结束，只切换显示模式，不更新计时数据
    if (timerState === 'finished') {
      return;
    }

    // 一次性更新：停止当前阶段 + 开始新阶段
    setStageTimes(prev => {
      const newStages = { ...prev };
      
      // 停止当前阶段（不重置current，保留累积时间）
      if (prev[mode].active) {
        newStages[mode] = {
          ...newStages[mode],
          active: false,
        };
      }

      // 如果计时器在运行，激活新阶段
      if (timerState === 'running') {
        newStages[newMode] = {
          ...newStages[newMode],
          active: true,
        };
        stageStartTimeRef.current = Date.now();
      }
      
      // 切换模式时保存数据
      const timerData = {
        startTime: startTimeRef.current || Date.now(),
        endTime: null,
        totalSeconds: elapsedTime,
        stages: newStages,
      };
      storage.saveTimerData(id, timerData);
      
      return newStages;
    });
  }, [mode, timerState, elapsedTime, id]);

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
    // 如果是finished状态，说明是继续练习，需要保留之前的累积时间
    if (timerState === 'finished') {
      setTimerState('idle');
    }
    startTimer();
    // 只更新active状态，不重置current
    setStageTimes(prev => ({
      original: { ...prev.original, active: mode === 'original' },
      outline: { ...prev.outline, active: mode === 'outline' },
      hint: { ...prev.hint, active: mode === 'hint' },
      free: { ...prev.free, active: mode === 'free' },
    }));
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

  const handleReset = () => {
    pauseTimer();
    setTimerState('idle');
    setElapsedTime(0);
    setDisplayTime('00:00');
    setStageTimes({
      original: { current: 0, total: 0, active: false },
      outline: { current: 0, total: 0, active: false },
      hint: { current: 0, total: 0, active: false },
      free: { current: 0, total: 0, active: false },
    });
    // 清除保存的计时数据
    storage.saveTimerData(id, {
      startTime: null,
      endTime: Date.now(),
      totalSeconds: 0,
      stages: {
        original: { current: 0, total: 0, active: false },
        outline: { current: 0, total: 0, active: false },
        hint: { current: 0, total: 0, active: false },
        free: { current: 0, total: 0, active: false },
      },
    });
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
              <>
                <button
                  onClick={handleReset}
                  className="px-4 py-1.5 rounded-lg text-sm bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                >
                  重置
                </button>
                <button
                  onClick={handleEnd}
                  className="px-4 py-1.5 rounded-lg text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  结束
                </button>
              </>
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
          <div className="grid grid-cols-4 gap-4">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                className={`py-3 text-sm font-medium transition-colors text-center ${
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
                <div className="w-full">
                  <div 
                    className="h-2 rounded-full overflow-hidden relative transition-all duration-300"
                    style={{
                      backgroundColor: isActive ? MODE_COLORS[m.key] + '30' : '#F3F4F6',
                    }}
                  >
                    {/* 进度条 */}
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: MODE_COLORS[m.key],
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-full text-center">
                  <p className="text-sm font-medium">{formatTime(totalTime + currentTime)}</p>
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
