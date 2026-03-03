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
