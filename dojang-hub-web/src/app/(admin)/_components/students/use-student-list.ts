import { Dispatch, SetStateAction, useEffect, useState } from "react";

export type StudentListState<T> = {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
  isLoading: boolean;
  error: string;
  reload: () => void;
};

export function useStudentList<T>(
  token: string,
  studentId: number,
  fetcher: (token: string, studentId: number) => Promise<{ data: T[] }>,
  errorMessage: string,
): StudentListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let isActive = true;

    queueMicrotask(() => {
      setIsLoading(true);
      setError("");
      fetcher(token, studentId)
        .then((result) => {
          if (isActive) setItems(result.data);
        })
        .catch((caught) => {
          if (isActive) setError(caught instanceof Error ? caught.message : errorMessage);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    });

    return () => {
      isActive = false;
    };
  }, [errorMessage, fetcher, reloadKey, studentId, token]);

  return { items, setItems, isLoading, error, reload: () => setReloadKey((current) => current + 1) };
}
