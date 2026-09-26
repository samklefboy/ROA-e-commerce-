import { useAuth } from "./hooks/useAuth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import AppRoutes from "./routes/AppRoutes";

function AppContext() {
  useAuth();

  return <AppRoutes />;
}

function App() {
  return (
    <>
      <AppContext />
    </>
  );
}

export default App;
