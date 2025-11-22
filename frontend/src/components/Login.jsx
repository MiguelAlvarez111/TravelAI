/**
 * Login.jsx - Componente de inicio de sesión
 * 
 * Diseño moderno con glassmorphism, consistente con el resto de la app
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plane, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const Login = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    const result = await login(email.trim(), password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Glass Card Principal */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Plane className="w-9 h-9 text-blue-600 animate-pulse" />
              <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                ViajeIA
              </h1>
            </div>
            <p className="text-slate-600 text-lg mt-3 font-medium">
              Inicia sesión para planificar tus aventuras
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-3">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 
                             bg-white border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                             disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60
                             text-slate-800 placeholder-slate-400 placeholder:font-normal
                             transition-all duration-300
                             shadow-sm hover:shadow-md focus:shadow-lg"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-3">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 
                             bg-white border border-slate-200 rounded-xl
                             focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                             disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60
                             text-slate-800 placeholder-slate-400 placeholder:font-normal
                             transition-all duration-300
                             shadow-sm hover:shadow-md focus:shadow-lg"
                />
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-4 bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 rounded-xl
                            flex items-start gap-3 animate-in fade-in duration-300 shadow-md">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* Botón de Inicio de Sesión */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3
                         bg-gradient-to-r from-blue-600 to-blue-500 
                         hover:from-blue-700 hover:to-blue-600
                         disabled:from-slate-300 disabled:to-slate-300
                         text-white font-semibold py-4 px-6 rounded-xl
                         shadow-lg hover:shadow-xl disabled:shadow-none
                         transition-all duration-300
                         disabled:cursor-not-allowed
                         transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none
                         relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Enlace a Registro */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
              >
                Regístrate aquí
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;

