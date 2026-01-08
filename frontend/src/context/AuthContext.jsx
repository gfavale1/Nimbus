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

                    sessionStorage.setItem("nimbus_user_id", userData.userId);
                    sessionStorage.setItem("nimbus_user_email", userData.email);
                    sessionStorage.setItem("nimbus_user_name", userData.name);

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