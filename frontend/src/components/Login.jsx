/**
 * Login.jsx - Componente de inicio de sesión
 * 
 * Diseño Apple Human Interface Guidelines - Mockup Apple
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plane, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Array de imágenes de viaje para rotación aleatoria
const TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80", // Bali/Beach
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=80", // Tokyo/City
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1920&q=80", // Alps/Snow
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80", // Desert/Canyon
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1920&q=80"  // Jungle/Nature
];

const Login = ({ onSwitchToRegister }) => {
  // Seleccionar una imagen aleatoria al montar el componente
  const randomImage = useMemo(() => {
    return TRAVEL_IMAGES[Math.floor(Math.random() * TRAVEL_IMAGES.length)];
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  // Función para validar email con regex
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    // Validar formato de email con regex
    if (!validateEmail(email.trim())) {
      setError('Por favor, ingresa un email válido');
      setLoading(false);
      return;
    }

    const result = await login(email.trim(), password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error al iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Plane className="w-9 h-9 text-slate-900" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                ViajeIA
              </h1>
            </div>
            <p className="text-slate-500 font-medium mt-3">
              Inicia sesión para planificar tus aventuras
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={loading}
                  className="w-full pl-12 pr-5 h-[50px]
                             bg-white border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                             disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60
                             text-base text-slate-900 placeholder-slate-400
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-12 pr-5 h-[50px]
                             bg-white border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                             disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60
                             text-base text-slate-900 placeholder-slate-400
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl
                            flex items-start gap-3 animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* Botón de Inicio de Sesión */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3
                         bg-slate-900 text-white
                         hover:bg-slate-800
                         disabled:bg-slate-300 disabled:text-slate-500
                         font-semibold h-[50px] px-6 rounded-xl
                         transition-all duration-200
                         disabled:cursor-not-allowed
                         active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">o continúa con</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3
                       bg-white text-slate-700 border border-slate-200
                       hover:bg-slate-50
                       disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                       font-semibold h-[50px] px-6 rounded-xl
                       transition-all duration-200
                       active:scale-[0.98]"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {/* Enlace a Registro */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-slate-900 font-semibold hover:underline transition-colors"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="relative hidden lg:block">
        <img
          src={randomImage}
          alt="Travel destination"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center px-8">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Tu próxima aventura comienza aquí
            </h2>
            <p className="text-white/90 text-lg">
              Descubre destinos increíbles y planifica el viaje de tus sueños
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

