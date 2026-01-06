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
                console.log("Tentativo di autenticazione via Proxy...");

                const res = await fetch(`/api/users/me`, {
                    credentials: "include",
                });

                console.log("Status ricevuto:", res.status);
                const contentType = res.headers.get("content-type");
                console.log("Content-Type ricevuto:", contentType);

                if (res.ok && contentType && contentType.includes("application/json")) {
                    const data = await res.json();
                    console.log("Dati utente ricevuti:", data);

                    if (data && Object.keys(data).length > 0) {
                        setUser(data);
                        setIsAuthenticated(true);
                        console.log("Autenticazione COMPLETATA con successo");
                    } else {
                        console.warn("Dati ricevuti vuoti, imposto false");
                        setIsAuthenticated(false);
                    }
                } else {
                    console.error("Fallito controllo header o status. OK:", res.ok, "CT:", contentType);
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
