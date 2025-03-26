import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useCalculatorAccess(calculatorType: string) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<{ hasAccess: boolean }>({
    queryKey: ["/api/calculators", calculatorType, "access"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return {
    hasAccess: data?.hasAccess || false,
    isLoading,
    error,
  };
}