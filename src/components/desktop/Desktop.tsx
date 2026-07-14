import React, { useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Win98Window } from '../windows/Win98Window';
import { Win98Button } from '../ui/Win98Button';
import { DesktopIcon } from './DesktopIcon';
import { Taskbar } from './Taskbar';
import { GuestbookWrite } from '../windows/GuestbookWrite';
import { GuestbookList } from '../windows/GuestbookList';
import { FrameSelect } from '../windows/FrameSelect';
import { Camera } from '../windows/Camera';
import { PhotoSelect } from '../windows/PhotoSelect';
import { Result } from '../windows/Result';
import { BgmPlayer } from '../bgm/BgmPlayer';

export const Desktop: React.FC = () => {
  const { openWindows, closeWindow } = useFlowStore();
  const [showWarning, setShowWarning] = useState(false);

  return (
    <div className="relative w-screen h-screen bg-[#008080] overflow-hidden flex flex-col font-sans select-none">
      
      {/* 1. Desktop Shortcuts container */}
      <div className="flex-1 p-4 relative z-10 flex flex-row sm:flex-col items-end sm:items-start justify-center sm:justify-start gap-4 sm:gap-1.5 h-[calc(100vh-34px)] max-h-[calc(100vh-34px)] overflow-y-auto
        /* Mobile: Bottom Dock positioning, PC: Left sidebar column */
        fixed sm:static bottom-[40px] left-0 w-full sm:w-auto sm:h-auto flex-wrap"
      >
        <DesktopIcon id="write" label="자리네컷" icon="📷" />
        <DesktopIcon id="guestbook" label="방명록" icon="✉️" />
        <DesktopIcon 
          id="pc" // placeholder bound
          label="내 사진첩" 
          icon="🖼️" 
          onClickCustom={() => setShowWarning(true)} 
        />
        <DesktopIcon id="pc" label="내 PC" icon="💻" />
        <DesktopIcon id="trash" label="휴지통" icon="🗑️" />
      </div>

      {/* 2. Window Panels render list */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="relative w-full h-full pointer-events-none">
          
          {/* Guestbook Write Window */}
          {openWindows.includes('write') && (
            <Win98Window id="write" title="응원 방명록 작성" icon="✍️" width="450px">
              <GuestbookWrite />
            </Win98Window>
          )}

          {/* Guestbook List Window */}
          {openWindows.includes('guestbook') && (
            <Win98Window id="guestbook" title="방명록.txt - 자리네컷 메모장" icon="📄" width="480px">
              <GuestbookList />
            </Win98Window>
          )}

          {/* Frame Select Window */}
          {openWindows.includes('frame') && (
            <Win98Window id="frame" title="인생컷 프레임 디자인 선택" icon="🎞️" width="460px">
              <FrameSelect />
            </Win98Window>
          )}

          {/* Camera Capture Window */}
          {openWindows.includes('camera') && (
            <Win98Window id="camera" title="찰칵! 8장 촬영 부스" icon="📷" width="680px">
              <Camera />
            </Win98Window>
          )}

          {/* Photo Order Select Window */}
          {openWindows.includes('select') && (
            <Win98Window id="select" title="인화할 4장 선택 및 배치" icon="✅" width="600px">
              <PhotoSelect />
            </Win98Window>
          )}

          {/* Result Composite Window */}
          {openWindows.includes('result') && (
            <Win98Window id="result" title="필터 적용 및 기기 저장" icon="🎨" width="580px">
              <Result />
            </Win98Window>
          )}

          {/* My PC Details Window */}
          {openWindows.includes('pc') && (
            <Win98Window id="pc" title="내 PC (System Info)" icon="💻" width="400px">
              <div className="text-xs font-sans text-black leading-relaxed flex flex-col gap-2 p-1">
                <div className="font-bold border-b border-gray-400 pb-1 mb-1">🖥️ 시스템 정보</div>
                <p><strong>프로그램명:</strong> 자리네컷 (Zarinaecut 98)</p>
                <p><strong>아키텍처:</strong> Next.js 16 · React 19 / Client Canvas Engine</p>
                <p><strong>데이터베이스:</strong> TiDB Cloud (MySQL 호환) · 방명록 텍스트만 저장</p>
                <p><strong>상태·이미지:</strong> Zustand · Canvas 2D (필터 8종 + 드로잉)</p>
                <p><strong>하드웨어 가속:</strong> Web MediaDevices & Web Audio Synthesizer</p>
                <p><strong>배포:</strong> Vercel (Serverless)</p>
                <div className="border-t border-gray-400 my-2 pt-2">
                  <p className="text-[#000080] font-bold">✓ 브라우저 적합성 진단:</p>
                  <p>카메라 권한 및 캔버스 합성 API 활성화됨. 최상의 경험을 위해 Chrome 혹은 Safari 브라우저 사용을 권장합니다.</p>
                </div>
                <div className="flex justify-end pt-2">
                  <Win98Button onClick={() => closeWindow('pc')} className="w-[80px]">
                    확인
                  </Win98Button>
                </div>
              </div>
            </Win98Window>
          )}

          {/* Trash Can Window */}
          {openWindows.includes('trash') && (
            <Win98Window id="trash" title="휴지통 (Trash Can)" icon="🗑️" width="350px">
              <div className="flex flex-col items-center justify-center p-6 gap-4 font-sans text-xs">
                <span className="text-4xl filter drop-shadow-[1px_1px_0px_rgba(0,0,0,0.4)]">🗑️</span>
                <span className="font-bold text-gray-700">휴지통이 완전히 비어 있습니다.</span>
                <Win98Button onClick={() => closeWindow('trash')} className="w-[85px]">
                  비우기
                </Win98Button>
              </div>
            </Win98Window>
          )}

          {/* Custom Win98 Warning dialog for "My Photos" folder */}
          {showWarning && (
            <div 
              style={{ zIndex: 999999 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 pointer-events-auto"
            >
              <div className="w-[340px] bg-[#c0c0c0] win-raised flex flex-col font-sans select-none text-black text-xs">
                <div className="bg-[#000080] text-white p-1 font-bold text-[11px] flex justify-between items-center">
                  <span>저장소 경고 : Storage Notice</span>
                  <button 
                    onClick={() => setShowWarning(false)}
                    className="w-3.5 h-3.5 bg-[#c0c0c0] win-raised text-black font-bold text-[9px] flex items-center justify-center border border-black"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4 flex gap-3 items-start">
                  <span className="text-3xl shrink-0">⚠️</span>
                  <div className="flex flex-col gap-1.5 leading-relaxed">
                    <span className="font-bold text-[12px]">사진 서버 미저장 보안 원칙</span>
                    <p>자리네컷은 어떠한 촬영 이미지 데이터도 웹 서버나 데이터베이스에 저장하지 않습니다.</p>
                    <p className="text-red-700 font-bold">사진은 오직 촬영 완료 단계의 [기기에 저장하기] 다운로드를 통해서만 보관할 수 있습니다!</p>
                  </div>
                </div>
                <div className="p-2 border-t border-[#808080] flex justify-end">
                  <Win98Button onClick={() => setShowWarning(false)} variant="primary" className="w-[75px]">
                    확인
                  </Win98Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. Floating Music Controller */}
      <BgmPlayer />

      {/* 4. Bottom Taskbar Menu */}
      <Taskbar onOpenMyPhotos={() => setShowWarning(true)} />

    </div>
  );
};
export default Desktop;
