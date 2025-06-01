import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const userContext = createContext();

const authContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedRole = sessionStorage.getItem("userRole");

        if (token) {
          const response = await axios.get(
            `http://localhost:5000/api/auth/verify`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            // Verify that the role matches the stored role
            if (storedRole && storedRole !== response.data.user.role) {
              handleLogout();
              return;
            }

            setUser(response.data.user);
            sessionStorage.setItem("userRole", response.data.user.role);
          } else {
            handleLogout();
          }
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  const login = (userData, token) => {
    // Clear any existing session data
    localStorage.removeItem("token");
    sessionStorage.removeItem("userRole");

    // Set new session data
    setUser(userData);
    localStorage.setItem("token", token);
    sessionStorage.setItem("userRole", userData.role);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <userContext.Provider value={{ user, login, logout: handleLogout, loading }}>
      {children}
    </userContext.Provider>
  );
};

export const useAuth = () => useContext(userContext);
export default authContext;
