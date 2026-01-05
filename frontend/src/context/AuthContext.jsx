import { createContext, useContext, useEffect, useState } from "react";
import { useRef } from "react";
import { useMsal } from "@azure/msal-react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { accounts } = useMsal(); 
    const hasBootstrapped = useRef(false);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function bootstrapAuth() {
            console.log("[AuthContext] bootstrapAuth START");

            if (hasBootstrapped.current) return;
            hasBootstrapped.current = true;

            try {
                const API_URL = import.meta.env.VITE_API_URL;

                const res = await fetch(`${API_URL}/api/users/me`, {
                  credentials: "include",
                });

                console.log("[AuthContext] /me status:", res.status);

                if (res.ok) {
                    const data = await res.json();
                    console.log("[AuthContext] authenticated user:", data);
                    setUser(data);
                    setIsAuthenticated(true);
                } else {
                    console.log("[AuthContext] not authenticated");
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error("[AuthContext] error:", err);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
                console.log("[AuthContext] loading = false");
            }
        }

        bootstrapAuth();
    }, [accounts]);


    useEffect(() => {
        function onUnauthorized() {
            setUser(null);
            setIsAuthenticated(false);
        }

        window.addEventListener("nimbus:unauthorized", onUnauthorized);
        return () => {
            window.removeEventListener("nimbus:unauthorized", onUnauthorized);
        };
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
