// Contexto de autenticación para el asistente de estilo
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../credenciales';
import { onAuthStateChanged } from 'firebase/auth';
import { getCurrentUser, logout as authLogout, getUserData } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData.user);
          setIdToken(userData.idToken);
          
          // Cargar datos adicionales del usuario
          const userDataResult = await getUserData(firebaseUser.uid);
          if (userDataResult.success && userDataResult.data) {
            setUserData(userDataResult.data);
          }
        }
      } else {
        // No autenticado
        setUser(null);
        setIdToken(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Refrescar token (útil si expira)
   */
  const refreshToken = async () => {
    try {
      const userData = await getCurrentUser(true); // Force refresh
      if (userData) {
        setIdToken(userData.idToken);
        return userData.idToken;
      }
      return null;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      return null;
    }
  };

  /**
   * Actualizar usuario después de autenticación
   */
  const updateUser = (newUser, newToken) => {
    setUser(newUser);
    setIdToken(newToken);
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
      setIdToken(null);
      setUserData(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const value = {
    user,
    idToken,
    userData,
    loading,
    isAuthenticated: !!user,
    refreshToken,
    updateUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
