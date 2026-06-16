import React, { useEffect, useState } from 'react';
import { GuestbookEntry } from '../../types';

export const GuestbookList: React.FC = () => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/guestbook');
      if (!response.ok) throw new Error();
      const result = await response.json();
      setEntries(result.data || []);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Set of vintage Windows 98 desktop colors for icon avatars
  const avatarColors = ['#000080', '#008000', '#800080', '#800000', '#008080', '#808000', '#0000ff', '#ff00ff'];

  const getAvatarColor = (id: string) => {
    // Generate a pseudo-random stable index from id
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${h}:${m}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[400px] sm:h-[450px] font-sans text-xs select-none">
      {/* Mock Menu Bar */}
      <div className="flex gap-3 px-1 py-[2px] border-b border-[#808080] text-black select-none text-[11px] shrink-0">
        <span className="cursor-default hover:bg-[#000080] hover:text-white px-1">File(F)</span>
        <span className="cursor-default hover:bg-[#000080] hover:text-white px-1">Edit(E)</span>
        <span className="cursor-default hover:bg-[#000080] hover:text-white px-1">Search(S)</span>
        <span className="cursor-default hover:bg-[#000080] hover:text-white px-1">Help(H)</span>
      </div>

      {/* Marquee Ticker */}
      <div className="bg-[#000] text-[#00ff00] h-6 overflow-hidden flex items-center border-b border-black font-mono text-[11px] select-none shrink-0">
        <div className="animate-marquee">
          📢 공지: 자리네컷은 사용자의 개인정보 보호를 최우선으로 생각합니다. 촬영한 소중한 사진은 서버에 절대 저장되지 않으며, 오직 다운로드받으신 사용자 기기에만 남습니다. 안심하고 즐겨주세요!
        </div>
      </div>

      {/* Notepad Yellow Body */}
      <div className="flex-1 bg-[#fffff0] border-t-2 border-l-2 border-[#808080] border-b-2 border-r-2 border-[#fff] shadow-[-1px_-1px_0px_0px_#000] overflow-y-auto p-3 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-bold">
            <span>⌛ 방명록 로딩 중...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-600 gap-2">
            <span>⚠️ 데이터를 불러오지 못했습니다.</span>
            <button 
              onClick={fetchEntries}
              className="px-2 py-1 bg-[#c0c0c0] win-raised text-black border border-black active:border-t active:border-l active:border-[#808080] text-[10px]"
            >
              다시 시도
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10 text-center">
            <span>아직 등록된 방명록이 없습니다.</span>
            <span>바탕화면의 [자리네컷]을 더블클릭해 첫 응원을 남겨보세요! ✍️</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map((entry) => (
              <div key={entry.id} className="border-b border-[#e2e2d0] pb-2 last:border-b-0">
                {/* Header: User Meta */}
                <div className="flex items-center gap-2 mb-1">
                  <div
                    style={{ backgroundColor: getAvatarColor(entry.id) }}
                    className="w-[10px] h-[10px] rounded-full shrink-0"
                  />
                  <span className="font-bold text-black">{entry.nickname}</span>
                  <span className="text-[10px] text-gray-500">{formatDate(entry.createdAt)}</span>
                </div>
                {/* Body: Message */}
                <div className="text-black pl-[18px] whitespace-pre-wrap break-all leading-relaxed">
                  - {entry.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-1 flex items-center justify-between border-t border-[#808080] pt-[2px] text-[10px] text-black shrink-0 px-1 select-none">
        <span>전체 {entries.length}개 · 표시 {entries.length}개</span>
        <span className="font-bold">★ 방명록은 익명으로 모두에게 공개됩니다 ★</span>
      </div>
    </div>
  );
};
