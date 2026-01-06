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
                const res = await fetch("/.auth/me");
                const data = await res.json();

                const principal = data.clientPrincipal || (data[0] ? data[0] : null);

                if (principal) {
                    const userData = {
                        userId: principal.userId,
                        name: principal.userDetails.split('@')[0], // Prendi la prima parte dell'email come nome
                        email: principal.userDetails
                    };

                    const backendUrl = "https://nimbus-app-ashhgbbrdvhjdgh6.italynorth-01.azurewebsites.net";
                    await fetch(`${backendUrl}/api/auth/register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(userData)
                    });

                    setUser(userData);
                    setIsAuthenticated(true);
                    console.log("Siamo dentro!");
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error("Errore:", err);
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
