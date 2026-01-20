'use client';

import { useCallback, useEffect, useRef, useState } from "react";

type RecordingFormat = "video/webm" | "video/mp4" | "image/gif";

const mimeTypeFallbackOrder: RecordingFormat[] = ["video/webm", "video/mp4"];

export const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(
    () => () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    },
    [downloadUrl],
  );

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setError(undefined);
    try {
      const target = document.querySelector("[data-capture-target]");
      if (!target) {
        throw new Error("Unable to find map viewport to capture");
      }
      const canvas = target.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas || typeof canvas.captureStream !== "function") {
        throw new Error("Map canvas capture stream is not available");
      }
      const stream = canvas.captureStream(60);
      let mimeType: RecordingFormat | undefined = mimeTypeFallbackOrder.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      if (!mimeType) {
        mimeType = "video/webm";
      }
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 12_000_000,
      });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : "Unable to start recording");
      setIsRecording(false);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
  }, []);

  const reset = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(undefined);
  }, [downloadUrl]);

  return {
    isRecording,
    downloadUrl,
    error,
    startRecording,
    stopRecording,
    reset,
  };
};
