import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const { instance } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
  let isMounted = true;

  const doLogout = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (isMounted) {
        await instance.logoutPopup({
          account: instance.getActiveAccount(),
          postLogoutRedirectUri: window.location.origin,
        });
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error(err);
      if (isMounted) navigate("/login", { replace: true });
    }
  };

  doLogout();
  return () => { isMounted = false; }; 
}, [instance, navigate]);


  return (
    <div style={styles.loaderContainer}>
      <div style={styles.loaderCard}>
        <div style={styles.logo}>☁️</div>
        <h2 style={styles.text}>Disconnessione in corso...</h2>
        <div style={styles.spinner}></div>
      </div>
    </div>
  );
}

const styles = {
  loaderContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #312e81 100%)",
    color: "white",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  loaderCard: {
    textAlign: "center",
    background: "rgba(255,255,255,0.05)",
    padding: "3rem 4rem",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    backdropFilter: "blur(6px)",
    animation: "fadeIn 0.6s ease-out",
  },
  logo: {
    fontSize: "3.2rem",
    animation: "pulse 2s infinite",
  },
  text: {
    fontSize: "1.2rem",
    fontWeight: 500,
    marginTop: "1rem",
  },
  spinner: {
    margin: "1.8rem auto 0",
    border: "4px solid rgba(255,255,255,0.2)",
    borderTop: "4px solid #fff",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    animation: "spin 1s linear infinite",
  },
};

