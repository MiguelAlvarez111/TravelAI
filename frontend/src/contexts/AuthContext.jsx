/**
 * AuthContext.jsx - Contexto de autenticación con Firebase
 * 
 * Maneja la sesión del usuario, login, registro y logout
 * Incluye observador onAuthStateChanged para mantener la sesión activa
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Componente Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Observador de cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, []);

  /**
   * Función para iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   */
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuario deshabilitado';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        default:
          errorMessage = error.message || 'Error al iniciar sesión';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Función para registrar un nuevo usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @param {string} name - Nombre del usuario
   */
  const register = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil con el nombre
      if (name) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      let errorMessage = 'Error al registrar usuario';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email ya está en uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil (mínimo 6 caracteres)';
          break;
        default:
          errorMessage = error.message || 'Error al registrar usuario';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Función para cerrar sesión
   */
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Error al cerrar sesión' };
    }
  };

  /**
   * Función para iniciar sesión con Google
   */
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return { success: true, user: userCredential.user };
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión con Google';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Ventana de autenticación cerrada';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Ventana emergente bloqueada. Por favor, permite ventanas emergentes';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Solo se puede abrir una ventana de autenticación a la vez';
          break;
        default:
          errorMessage = error.message || 'Error al iniciar sesión con Google';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

