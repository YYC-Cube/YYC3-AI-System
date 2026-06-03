/**
 * @file useStreamText.ts
 * @description 流式打字机输出 Hook - 逐字渲染，不阻塞界面
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-03
 * @tags hooks,streaming,ai,typing-effect
 */

import { useState, useRef, useCallback } from 'react';

export function useStreamText() {
  const [renderText, setRenderText] = useState('');
  const abortRef = useRef(false);

  /** Start streaming display - reveals fullStr character by character */
  const startStream = useCallback(async (fullStr: string, speed = 12) => {
    abortRef.current = false;
    setRenderText('');
    let cur = '';
    for (let i = 0; i < fullStr.length; i++) {
      if (abortRef.current) break;
      cur += fullStr[i];
      setRenderText(cur);
      await new Promise((r) => setTimeout(r, speed));
    }
  }, []);

  /** Instantly finish and display full text */
  const fastFinish = useCallback((fullStr: string) => {
    abortRef.current = true;
    setRenderText(fullStr);
  }, []);

  /** Abort current stream */
  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { renderText, setRenderText, startStream, fastFinish, abort };
}
