"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "../api/upload-api";
import { useEventBus } from "@/store/event-bus";

export function useUploadFile() {
  const queryClient = useQueryClient();
  const emit = useEventBus((s) => s.emit);

  return useMutation({
    mutationFn: ({ file, clusterId }: { file: File; clusterId: string }) =>
      uploadFile(file, clusterId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      emit("upload:complete", { fileId: data.file_id });
    },
  });
}
