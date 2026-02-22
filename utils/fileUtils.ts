
import JSZip from 'jszip';
import { Scene } from '../types';

/**
 * 대본을 장면(Scene) 단위로 파싱합니다.
 * 1. 숫자 패턴(1., 2.)이 있으면 숫자 기준으로 분할
 * 2. 숫자 패턴이 없으면 빈 줄(문단 여백) 기준으로 분할
 */
export const parseScript = (text: string): Scene[] => {
  if (!text.trim()) return [];

  // 숫자 패턴(줄 시작부분의 "1.") 존재 여부 확인
  const numericRegex = /(?:^|\n)\s*(\d+)\.\s+/;
  const hasNumericMarkers = numericRegex.test(text);

  let segments: { number: string; content: string }[] = [];

  if (hasNumericMarkers) {
    // 숫자 기반 분할
    // split할 때 괄호를 사용하여 캡처하면 결과 배열에 구분자(숫자)도 포함됨
    const parts = text.split(/(?:^|\n)\s*(\d+)\.\s+/);
    
    // parts[0]은 첫 숫자 이전의 텍스트 (보통 빈 문자열)
    for (let i = 1; i < parts.length; i += 2) {
      const num = parts[i];
      const content = parts[i + 1]?.trim();
      if (content) {
        segments.push({ number: num, content });
      }
    }
  } else {
    // 문단 기반 분할 (빈 줄 기준)
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    segments = paragraphs.map((content, idx) => ({
      number: (idx + 1).toString(),
      content
    }));
  }

  return segments.map((seg) => {
    // 파일명을 위한 첫 줄 추출 및 특수문자 제거
    const firstLine = seg.content.split('\n')[0]
      .replace(/[\\/:*?"<>|]/g, '') 
      .trim()
      .slice(0, 60); 
        
    return {
      id: Math.random().toString(36).substr(2, 9),
      number: seg.number,
      description: seg.content,
      filename: `${seg.number}_${firstLine || 'scene'}.png`,
      status: 'idle',
      variants: []
    };
  });
};

export const downloadAsZip = async (scenes: Scene[]) => {
  const zip = new JSZip();
  const folder = zip.folder("storyboard_images");

  if (!folder) return;

  for (const scene of scenes) {
    scene.variants.forEach((variant, index) => {
      const base64Data = variant.imageUrl.split(',')[1];
      const filename = scene.variants.length > 1 
        ? scene.filename.replace('.png', `_v${index + 1}.png`)
        : scene.filename;
      folder.file(filename, base64Data, { base64: true });
    });
  }

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = "storyboard_package_full_history.zip";
  link.click();
};

export const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ 
      data: reader.result as string, 
      mimeType: file.type 
    });
    reader.onerror = error => reject(error);
  });
};
