// lib/api.ts
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://atalayas-backend-1.onrender.com/api/v1";

// Variables de control para evitar bucles infinitos de refresco
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Wrapper de fetch que incluye credentials: "include", inyecta el accessToken,
 * y atrapa los Errores 401 para refrescar la sesión automáticamente.
 */
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  
  // 1. Obtener token actual (si existe)
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  // Si el body es FormData dejamos que el browser ponga el Content-Type (multipart/form-data con boundary)
  const isFormData = options?.body instanceof FormData;

  // Opciones de la petición original
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeader,
      ...options.headers,
    },
  };

  try {
    // 2. Intentamos la petición original
    let response = await fetch(url, fetchOptions);

    // 3. Si NO es un 401 (Unauthorized), devolvemos la respuesta normal y todo sigue su curso
    if (response.status !== 401) {
      return response;
    }

    // 4. Si da 401 pero la petición YA era para refrescar o hacer login, no hacemos nada 
    // (para evitar un bucle infinito donde el refresh llame al refresh)
    if (url.includes("/auth/refresh-token") || url.includes("/auth/login")) {
      return response;
    }

    // --- ¡ALARMA 401! Inicia el protocolo de refresco ---

    // 5. Si ya hay otra petición refrescando, metemos esta a la cola de espera
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          // Cuando toque su turno, actualizamos la cabecera con el nuevo token y reintentamos
          const retryHeaders = { ...fetchOptions.headers } as Record<string, string>;
          if (newToken) retryHeaders["Authorization"] = `Bearer ${newToken}`;
          
          return fetch(url, { ...fetchOptions, headers: retryHeaders });
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    // 6. Pedimos el nuevo token a César
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        credentials: "include", // CRUCIAL enviar la cookie refreshToken
      });

      if (!refreshResponse.ok) {
        throw new Error("El Refresh Token también ha caducado");
      }

      // 7. Extraemos el nuevo token y lo guardamos en localStorage
      let newAccessToken = null;
      try {
        const refreshData = await refreshResponse.json();
        // Ajusta "accessToken" si César lo llama diferente en el JSON (ej. "token")
        newAccessToken = refreshData.accessToken || refreshData.token; 
        
        if (newAccessToken && typeof window !== "undefined") {
          localStorage.setItem("accessToken", newAccessToken);
        }
      } catch (e) {
        console.warn("No se pudo leer el JSON del refresh-token. Dependiendo solo de cookies.");
      }

      // 8. Liberamos a las peticiones que estaban en cola de espera
      processQueue(null, newAccessToken);

      // 9. Reintentamos NUESTRA petición original con el nuevo token
      const finalHeaders = { ...fetchOptions.headers } as Record<string, string>;
      if (newAccessToken) {
        finalHeaders["Authorization"] = `Bearer ${newAccessToken}`;
      }
      
      return await fetch(url, { ...fetchOptions, headers: finalHeaders });

    } catch (refreshError) {
      // 10. Si el refresco falla por completo (pasaron 7 días), echamos al usuario.
      processQueue(refreshError, null);
      
      if (typeof window !== "undefined") {
        console.warn("Sesión caducada por completo. Redirigiendo al login...");
        localStorage.removeItem("accessToken"); // Limpiamos para evitar problemas
        
        setTimeout(() => {
           window.location.href = "/login";
        }, 500);
      }
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }

  } catch (error) {
    return Promise.reject(error);
  }
};