import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '../api/files-api';

export function useFileVersions(fileId: string) {
  return useQuery({
    queryKey: ['file-versions', fileId],
    queryFn: () => filesApi.versions(fileId),
    enabled: !!fileId,
  });
}

export function useCreateVersion(fileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => filesApi.createVersion(fileId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-versions', fileId] });
    },
  });
}
