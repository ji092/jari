import React, { useEffect, useRef, useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Win98Button } from '../ui/Win98Button';

export const GuestbookWrite: React.FC = () => {
  const { closeWindow, openWindow } = useFlowStore();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 방명록 미입력/초과 예외: 진입 차단 + 안내 메시지 표시
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      setErrorMsg('한 줄 이상 남겨야 입장권을 받을 수 있어요!');
      return;
    }
    if (message.length > 200) {
      setErrorMsg('방명록은 200자 이내로 작성해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '방명록 저장에 실패했습니다.');
      }

      // Success: Proceed to frame selection (창이 이미 닫혔다면 이동하지 않음)
      if (mountedRef.current) {
        closeWindow('write');
        openWindow('frame');
      }
    } catch (err: any) {
      if (mountedRef.current) setErrorMsg(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-sans h-full">
      {/* Informative Welcome Box */}
      <div className="p-2 bg-[#fffff0] border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] shadow-[-1px_-1px_0px_0px_#000] text-center font-bold text-xs select-none">
        ★ 응원 방명록 쓰고 사진 찍자! ★
      </div>

      {/* Nickname (Disabled Input) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold select-none text-[#333]">글쓴이</label>
        <input
          type="text"
          value="익명의 포토쟁이"
          disabled
          className="px-2 py-1 text-xs bg-[#e6e6e6] text-[#808080] border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] outline-none cursor-not-allowed select-none"
        />
      </div>

      {/* Message textarea */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex justify-between items-center select-none">
          <label className="text-xs font-bold text-[#333]">응원 한 마디</label>
          <span className={`text-[10px] font-bold ${message.length >= 200 ? 'text-red-600' : 'text-[#808080]'}`}>
            {message.length} / 200
          </span>
        </div>
        
        <textarea
          rows={4}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value.slice(0, 200));
            if (errorMsg) setErrorMsg('');
          }}
          placeholder="여기에 한 줄을 남겨주시면 촬영 권한을 얻을 수 있습니다! (욕설 및 도배는 제한될 수 있습니다.)"
          className="p-2 text-xs bg-[#ffffff] border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] shadow-[-1px_-1px_0px_0px_#000] outline-none text-black resize-none flex-1 min-h-[80px]"
          disabled={isSubmitting}
        />
      </div>

      {/* Error Output */}
      {errorMsg && (
        <div className="text-red-700 text-xs font-bold select-none text-center bg-[#ffe6e6] p-1 border border-red-400">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 select-none">
        <Win98Button
          onClick={() => closeWindow('write')}
          disabled={isSubmitting}
          className="w-[80px] whitespace-nowrap"
        >
          메인으로
        </Win98Button>
        <Win98Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="w-[120px]"
        >
          {isSubmitting ? '전송 중...' : '입장권 받기'}
        </Win98Button>
      </div>
    </form>
  );
};
