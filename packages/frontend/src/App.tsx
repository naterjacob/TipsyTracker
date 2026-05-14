import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import LogIn from "./pages/logIn"
import Home from "./pages/home"

const ProtectedRoutes = () => {
  //if user isnt logged in, return to login page, needs more logic but set to true to work with pages
  const user = true;
  if (!user) return <Navigate to="/" />;
  else return <Outlet />;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LogIn />} />

        {/*Routes here just mean that, once a user is logged in it can access tha following pages*/}
        <Route element={<ProtectedRoutes />}>
          <Route path="/home" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}
export default App;
