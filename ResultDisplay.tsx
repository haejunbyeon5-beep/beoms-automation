import React from 'react';
import { OutputItem } from '../types';
import { FileText, Image, Copy, Users } from 'lucide-react';

interface Props {
  results: OutputItem[];
  characterOverview: string | null;
}

export const ResultDisplay: React.FC<Props> = ({ results, characterOverview }) => {
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSummaries = () => {
    const content = results.map(r => `[${r.timeCode}] ${r.summary}`).join('\n\n');
    downloadFile('summaries.txt', content);
  };

  const downloadPrompts = () => {
    const content = results.map(r => r.prompt).join('\n\n');
    downloadFile('prompts.txt', content);
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (results.length === 0 && !characterOverview) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 italic">
        생성된 결과가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-200">생성된 시퀀스 ({results.length})</h3>
        <div className="flex gap-2">
          <button
            onClick={downloadSummaries}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded transition-colors"
          >
            <FileText size={14} /> 요약본 다운로드
          </button>
          <button
            onClick={downloadPrompts}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded transition-colors"
          >
            <Image size={14} /> 프롬프트 다운로드
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {characterOverview && (
          <div className="m-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h4 className="text-sm font-bold text-orange-400 mb-2 flex items-center gap-2">
              <Users size={16} /> 등장인물 캐릭터 외형 전체 요약 (Character Overview)
            </h4>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed bg-gray-900/50 p-3 rounded">
              {characterOverview}
            </pre>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-800/50 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-xs font-semibold text-gray-400 border-b border-gray-700 w-32">시간 구간</th>
              <th className="p-3 text-xs font-semibold text-gray-400 border-b border-gray-700 w-1/4">한국어 요약</th>
              <th className="p-3 text-xs font-semibold text-gray-400 border-b border-gray-700">이미지 프롬프트 (Whisk Optimized)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {results.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30 transition-colors group">
                <td className="p-3 text-xs text-blue-400 font-mono align-top whitespace-nowrap">
                  {item.timeCode}
                </td>
                <td className="p-3 text-sm text-gray-300 align-top leading-relaxed">
                  {item.summary}
                </td>
                <td className="p-3 text-xs text-gray-400 align-top font-mono leading-relaxed relative">
                  <div className="line-clamp-6 group-hover:line-clamp-none transition-all duration-300">
                    {item.prompt}
                  </div>
                  <button
                    onClick={() => copyPrompt(item.prompt)}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white"
                    title="프롬프트 복사"
                  >
                    <Copy size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};