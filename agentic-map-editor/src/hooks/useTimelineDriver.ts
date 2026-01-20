'use client';

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";

export const useTimelineDriver = () => {
  const { isPlaying, playbackRate, duration } = useEditorStore((state) => state.timeline);
  const seek = useEditorStore((state) => state.seek);
  const pause = useEditorStore((state) => state.pause);

  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaMs = timestamp - (lastTimeRef.current ?? timestamp);
      lastTimeRef.current = timestamp;
      const deltaSeconds = (deltaMs / 1000) * playbackRate;
      const current = useEditorStore.getState().timeline.currentTime;
      const next = current + deltaSeconds;
      if (next >= duration) {
        seek(duration);
        pause();
        return;
      }
      seek(next);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [duration, isPlaying, pause, playbackRate, seek]);
};
