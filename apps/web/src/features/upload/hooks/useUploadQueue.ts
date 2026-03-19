"use client";

import { useCallback, useState } from "react";

export interface QueueItem {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function useUploadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);

  const addFiles = useCallback((fileList: FileList) => {
    const newItems: QueueItem[] = Array.from(fileList).map((f) => ({
      file: f,
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const updateStatus = useCallback(
    (index: number, status: QueueItem["status"], error?: string) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status, error } : item)),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  return { items, addFiles, updateStatus, clear };
}
