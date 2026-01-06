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
                const API_URL = import.meta.env.VITE_API_URL;
                console.log("Tentativo di autenticazione verso:", API_URL);

                const res = await fetch(`${API_URL}/api/users/me`, {
                    credentials: "include",
                });

                console.log("Risposta server status:", res.status);

                if (res.ok) {
                    const data = await res.json();
                    console.log("Dati utente ricevuti:", data);
                    setUser(data);
                    setIsAuthenticated(true);
                } else {
                    const errorText = await res.text();
                    console.warn("Autenticazione fallita. Dettagli:", errorText);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error("Errore di rete durante bootstrapAuth:", err);
                setUser(null);
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
