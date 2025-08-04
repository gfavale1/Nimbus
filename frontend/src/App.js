import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL)
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => console.error("Errore:", err));
  }, []);

  return (
    <div>
      <h1>Progetto Cloud</h1>
      <p>Messaggio dal backend: {message}</p>
    </div>
  );
}

export default App;
