export interface QueuedFile {
  file: File;
  id: string;
}

export function reconcileQueuedFiles(
  nextFiles: File[],
  previousFiles: QueuedFile[],
) {
  const remaining = [...previousFiles];

  return nextFiles.map((file) => {
    const existingIndex = remaining.findIndex((entry) => entry.file === file);

    if (existingIndex >= 0) {
      const [existing] = remaining.splice(existingIndex, 1);
      return existing;
    }

    return {
      file,
      id: crypto.randomUUID(),
    } satisfies QueuedFile;
  });
}
