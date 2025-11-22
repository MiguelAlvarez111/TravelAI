/**
 * Register.jsx - Componente de registro
 * 
 * Diseño moderno con glassmorphism, consistente con el resto de la app
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plane, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const Register = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Función para validar email con regex
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
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

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    const result = await register(email.trim(), password, name.trim());
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Tarjeta Central */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/5 p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Plane className="w-9 h-9 text-slate-900" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                ViajeIA
              </h1>
            </div>
            <p className="text-slate-500 font-medium mt-3">
              Crea tu cuenta y comienza a planificar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nombre */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 
                             bg-slate-100 border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60
                             text-lg text-slate-900 placeholder-slate-400
                             transition-all duration-300"
                />
              </div>
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                             bg-slate-100 border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60
                             text-lg text-slate-900 placeholder-slate-400
                             transition-all duration-300"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 
                             bg-slate-100 border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60
                             text-lg text-slate-900 placeholder-slate-400
                             transition-all duration-300"
                />
              </div>
            </div>

            {/* Campo Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  disabled={loading}
                  className="w-full pl-12 pr-5 py-4 
                             bg-slate-100 border-transparent rounded-xl
                             focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                             disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60
                             text-lg text-slate-900 placeholder-slate-400
                             transition-all duration-300"
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

            {/* Botón de Registro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3
                         bg-black text-white
                         hover:bg-slate-800
                         disabled:bg-slate-300 disabled:text-slate-500
                         font-semibold py-4 px-6 rounded-full
                         transition-colors duration-300
                         disabled:cursor-not-allowed
                         active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <span>Crear Cuenta</span>
              )}
            </button>
          </form>

          {/* Enlace a Login */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-slate-900 font-semibold hover:underline transition-colors"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;

