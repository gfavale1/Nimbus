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
        const res = await fetch("/.auth/me", { credentials: "include" });

        if (!res.ok) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        const data = await res.json();
        const principal = data.clientPrincipal || (data[0] ? data[0] : null);

        if (principal) {
          const userData = {
            userId: principal.userId,
            name: principal.userDetails.split("@")[0],
            email: principal.userDetails,
          };

          sessionStorage.setItem("nimbus_user_id", userData.userId);
          sessionStorage.setItem("nimbus_user_email", userData.email);
          sessionStorage.setItem("nimbus_user_name", userData.name);

          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    bootstrapAuth();
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);

    sessionStorage.removeItem("nimbus_user_id");
    sessionStorage.removeItem("nimbus_user_email");
    sessionStorage.removeItem("nimbus_user_name");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}