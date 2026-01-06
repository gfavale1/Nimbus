import { createContext, useContext, useEffect, useRef, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const hasBootstrapped = useRef(false);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function bootstrapAuth() {
            if (hasBootstrapped.current) return;
            hasBootstrapped.current = true;

            try {
                // Rimuoviamo il controllo "if (!API_URL)"
                const API_URL = import.meta.env.VITE_API_URL || "";

                console.log("Tentativo di autenticazione via Proxy...");

                // Se API_URL è vuoto, la fetch diventerà "/api/users/me"
                const res = await fetch(`${API_URL}/api/users/me`, {
                    credentials: "include",
                });

                console.log("Risposta Proxy status:", res.status);

                const contentType = res.headers.get("content-type");
                if (res.ok && contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    setUser(data);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error("Errore autenticazione:", err.message);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        }

        bootstrapAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
}
