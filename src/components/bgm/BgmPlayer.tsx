import React, { useEffect, useRef } from 'react';
import { useBgmStore } from '../../store/bgmStore';
import { Win98Button } from '../ui/Win98Button';

const TRACKS = [
  { name: "Frog's Legs Rag", file: 'Frogs_Legs_Rag.mp3' },
  { name: 'Moonlight Beach', file: 'Moonlight_Beach.mp3' },
  { name: 'Ethernight Club', file: 'Ethernight_Club.mp3' },
  { name: 'Late Night Radio', file: 'Late_Night_Radio.mp3' },
  { name: 'Dentaneosuchus Hunt', file: 'Dentaneosuchus_Hunt.mp3' },
  { name: 'Night in Venice', file: 'Night_in_Venice.mp3' },
];

export const BgmPlayer: React.FC = () => {
  const { 
    trackIndex, 
    isPlaying, 
    progress, 
    isOpen, 
    play, 
    pause, 
    next, 
    prev, 
    setTrack, 
    setProgress, 
    toggleOpen 
  } = useBgmStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[trackIndex];

  // Sync isPlaying with HTML5 audio play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.warn('Playback blocked by browser auto-play policy:', e);
        pause(); // fallback to paused state if blocked
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, trackIndex, pause]);

  // Sync track file source
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Set source to local asset
    audioRef.current.src = `/bgm/${currentTrack.file}`;
    audioRef.current.load();
    
    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.warn('Track switch play blocked:', e);
      });
    }
  }, [trackIndex]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    const cur = audioRef.current.currentTime;
    if (dur && cur) {
      setProgress((cur / dur) * 100);
    }
  };

  const handleAudioEnded = () => {
    next(); // auto play next song on track ended
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = clickX / width;
    
    const targetTime = clickRatio * audioRef.current.duration;
    if (!isNaN(targetTime)) {
      audioRef.current.currentTime = targetTime;
      setProgress(clickRatio * 100);
    }
  };

  return (
    <>
      {/* Audio는 최소화 여부와 무관하게 항상 유지 */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* 최소화 상태 */}
      {!isOpen && (
        <div
          style={{ zIndex: 9998 }}
          onClick={toggleOpen}
          className="fixed bottom-[38px] right-2 bg-[#c0c0c0] win-raised px-2 py-1 flex items-center gap-1.5 cursor-pointer text-xs select-none hover:bg-[#d5d5d5] text-black"
        >
          <span className="animate-blink">🎵</span>
          <span className="font-bold">BGM</span>
        </div>
      )}

      {/* 전체 플레이어 */}
      {isOpen && (
      <div
        style={{ zIndex: 9998 }}
        className="fixed bottom-[38px] right-2 w-[220px] bg-[#c0c0c0] win-raised flex flex-col font-sans select-none text-black text-xs"
      >
      {/* Title Bar */}
      <div className="win-titlebar p-1 flex items-center justify-between font-bold text-[11px]">
        <span className="flex items-center gap-1">📻 BGM 플레이어</span>
        <button
          onClick={toggleOpen}
          className="w-3.5 h-3.5 bg-[#c0c0c0] win-raised text-black font-bold text-[9px] flex items-center justify-center border border-black active:border-t active:border-l active:border-[#808080] active:border-b-0 active:border-r-0"
        >
          _
        </button>
      </div>

      {/* Marquee Ticker & Visualizer Screen */}
      <div className="p-2 bg-black border border-t-[#808080] border-l-[#808080] border-b-[#fff] border-r-[#fff] m-1 flex flex-col gap-1.5 overflow-hidden">
        {/* Equalizer Vis */}
        <div className="flex items-end justify-center gap-[3px] h-6 bg-black">
          {Array.from({ length: 9 }).map((_, i) => {
            const delay = (i * 0.1).toFixed(2);
            return (
              <div
                key={i}
                style={{
                  animationDelay: `${delay}s`,
                  animationPlayState: isPlaying ? 'running' : 'paused',
                  height: isPlaying ? undefined : '3px'
                }}
                className="w-[6px] bg-[#00ff00] visualizer-bar"
              />
            );
          })}
        </div>

        {/* Ticker Name */}
        <div className="text-[#00ff00] font-mono text-[10px] overflow-hidden relative h-4 bg-black select-none">
          <div className={`${isPlaying ? 'animate-marquee' : 'text-center w-full'}`}>
            {isPlaying ? `▶ 재생 중: ${currentTrack.name} ~~~` : `⏹ 일시정지: ${currentTrack.name}`}
          </div>
        </div>
      </div>

      {/* Progress Bar slider */}
      <div className="px-2 py-1">
        <div 
          onClick={handleProgressBarClick}
          className="h-3 w-full bg-[#808080] border border-[#fff] p-[1px] relative cursor-pointer"
        >
          <div 
            style={{ width: `${progress}%` }}
            className="h-full bg-[#000080]"
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        <Win98Button onClick={prev} className="px-1.5 py-0.5 text-[10px]">
          ⏮ 이전
        </Win98Button>
        <Win98Button 
          onClick={isPlaying ? pause : play} 
          variant="primary" 
          className="px-3 py-0.5 text-[10px]"
        >
          {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
        </Win98Button>
        <Win98Button onClick={next} className="px-1.5 py-0.5 text-[10px]">
          ⏭ 다음
        </Win98Button>
      </div>

      {/* Scrollable Track list */}
      <div className="win-sunken m-1 h-[75px] overflow-y-auto bg-white p-1 text-[10px] flex flex-col border border-t-[#808080] border-l-[#808080] border-b-[#fff] border-r-[#fff]">
        {TRACKS.map((track, idx) => {
          const isSelected = trackIndex === idx;
          return (
            <div
              key={idx}
              onClick={() => setTrack(idx)}
              className={`px-1.5 py-0.5 cursor-pointer flex items-center justify-between truncate ${
                isSelected 
                  ? 'bg-[#000080] text-white font-bold' 
                  : 'hover:bg-gray-200 text-black'
              }`}
            >
              <span className="truncate">{track.name}</span>
              {isSelected && <span className="text-[8px]">▶</span>}
            </div>
          );
        })}
      </div>
    </div>
      )}
    </>
  );
};
