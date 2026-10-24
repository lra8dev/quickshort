import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";

const SERVER_API = import.meta.env.VITE_SERVER_API!;

export const useShortUrl = () => {
  const [error, setError] = useState<Error | null>(null);

  const mutationFn = useCallback(async (url: string) => {
    const response = await fetch(`${SERVER_API}/api/url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ longUrl: url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to shorten URL");
    }

    return data;
  }, []);

  const { data, mutate, isPending } = useMutation({
    mutationFn,
    onSuccess: (data) => {
      toast.success(data?.message || "Short URL created successfully");
    },
    onError: (error) => {
      setError(error);
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(error?.message || "Unexpected error occurred.");
    }
  }, [error]);

  return { data: error ? null : data, mutate, isPending };
};
