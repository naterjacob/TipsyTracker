import {Routes, Route, Outlet, Navigate} from 'react-router-dom';
import LogIn from "./pages/logIn"
import Home from "./pages/home"

const ProtectedRoutes = () => {
  const user = true;
  if (!user) return <Navigate to= "/"/>;
  else return <Outlet/>;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LogIn/>} />

        <Route element={<ProtectedRoutes/>}>
          <Route path="/home" element={<Home />} />
          </Route>
      </Routes>
    </>
  );
}
export default App;
