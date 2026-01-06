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
                const azureRes = await fetch("/.auth/me");
                const azureData = await azureRes.json();

                if (azureData && azureData[0]) {
                    const clientPrincipal = azureData[0];
                    const userData = {
                        userId: clientPrincipal.user_id,
                        name: clientPrincipal.user_claims.find(c => c.typ === "name")?.val || clientPrincipal.user_id,
                        email: clientPrincipal.user_id // In EntraID spesso l'id è l'email
                    };

                    const backendUrl = "https://nimbus-app-ashhgbbrdvhjdgh6.italynorth-01.azurewebsites.net";
                    const regRes = await fetch(`${backendUrl}/api/auth/register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(userData)
                    });

                    if (regRes.ok) {
                        setUser(userData);
                        setIsAuthenticated(true);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error("Errore Bootstrapping Auth:", err);
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
