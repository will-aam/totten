// lib/api-client.ts

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  safe?: boolean; // 🛡️ Nova propriedade para controle de exceções
}

// 🛡️ Assinaturas de sobrecarga para o TypeScript inferir o retorno corretamente
export async function apiClient<T>(endpoint: string, options: FetchOptions & { safe: true }): Promise<T | ApiError>;
export async function apiClient<T>(endpoint: string, options?: Omit<FetchOptions, 'safe'> & { safe?: false }): Promise<T>;
export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<any> {
  const { params, safe, ...customConfig } = options;

  // Centralizando o base path para apontar sempre para nossa API local
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

  // Garante que o endpoint comece com '/' se o baseUrl não terminar
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  let url = `${baseUrl}${normalizedEndpoint}`;

  // Formatação automática de query params
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      ...customConfig.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    // Parse centralizado de erro
    let errorMessage = "Ocorreu um erro inesperado no servidor.";
    let errorBody: unknown;
    try {
      errorBody = await response.json();
      const parsed = errorBody as { message?: string; error?: string };
      errorMessage = parsed.message || parsed.error || errorMessage;
    } catch (e) {
      // Fallback caso a resposta de erro não seja um JSON válido
    }
    
    const apiError = new ApiError(response.status, errorMessage, errorBody);

    // 🛡️ Se safe=true, retornamos o erro como valor ao invés de explodir a stack
    if (safe) {
      return apiError;
    }

    throw apiError;
  }

  // Guarda contra respostas sem corpo (204, ou 200 sem payload) —
  // response.json() lança SyntaxError num body vazio
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  // Retorno tipado automaticamente
  return JSON.parse(text);
}