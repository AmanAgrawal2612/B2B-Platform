import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { Store, User, Lock, Mail, ArrowRight, TrendingUp } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'ShopOwner', shopName: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await apiClient.post('/api/auth/login', { email: formData.email, password: formData.password });
        dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
        const role = res.data.user.role;
        if (role === 'ShopOwner') navigate('/shop-owner');
        else if (role === 'Customer') navigate('/customer');
        else if (role === 'Admin') navigate('/admin');
        else navigate('/');
      } else {
        await apiClient.post('/api/auth/register', formData);
        setIsLogin(true);
        alert("Registration successful! Please login.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden">
      
      {/* Left Branding Panel (Hidden on Mobile, Visible on md+) */}
      <div className="hidden md:flex md:w-1/2 lg:w-7/12 relative flex-col justify-between p-12 overflow-hidden">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 z-0"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-400 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-400 rounded-full mix-blend-screen filter blur-[100px] opacity-60"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WholesaleOS</h1>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            The Future of <br/>B2B Commerce.
          </h2>
          <p className="text-xl text-blue-100 font-light leading-relaxed">
            Manage your inventory, connect with suppliers, and unlock AI-powered sales forecasts all in one unified platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-white/80 text-sm font-medium">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-indigo-600 flex items-center justify-center shadow-lg"><User className="w-5 h-5 text-white" /></div>
            <div className="w-10 h-10 rounded-full bg-emerald-400 border-2 border-indigo-600 flex items-center justify-center shadow-lg"><Store className="w-5 h-5 text-white" /></div>
            <div className="w-10 h-10 rounded-full bg-purple-400 border-2 border-indigo-600 flex items-center justify-center shadow-lg"><TrendingUp className="w-5 h-5 text-white" /></div>
          </div>
          <p>Join thousands of businesses growing with WholesaleOS.</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="md:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4 shadow-sm border border-blue-100">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              WholesaleOS
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start your digital storefront today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" placeholder="Full Name" required 
                  className="premium-input pl-12 pr-4 h-12"
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="email" placeholder="Email Address" required 
                className="premium-input pl-12 pr-4 h-12"
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="password" placeholder="Password" required 
                className="premium-input pl-12 pr-4 h-12"
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            {!isLogin && (
              <div className="space-y-5 pt-2 border-t border-slate-100">
                <select 
                  className="premium-input px-4 h-12 font-medium text-slate-700 bg-slate-50 cursor-pointer"
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  value={formData.role}
                >
                  <option value="ShopOwner">I am a Shop Owner</option>
                  <option value="Customer">I am a Customer</option>
                </select>
                
                {formData.role === 'ShopOwner' && (
                  <div className="space-y-5 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="relative group">
                      <Store className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="text" placeholder="Shop Name" required 
                        className="premium-input pl-12 pr-4 h-12"
                        onChange={e => setFormData({...formData, shopName: e.target.value})} 
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 font-bold text-center leading-5 text-sm group-focus-within:text-blue-500 transition-colors">#</div>
                      <input 
                        type="tel" placeholder="Phone Number" required 
                        className="premium-input pl-12 pr-4 h-12"
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                      />
                    </div>
                    <div className="flex gap-4">
                      <input 
                        type="text" placeholder="City" required 
                        className="premium-input px-4 h-12 w-1/2"
                        onChange={e => setFormData({...formData, city: e.target.value})} 
                      />
                      <input 
                        type="text" placeholder="State" required 
                        className="premium-input px-4 h-12 w-1/2"
                        onChange={e => setFormData({...formData, state: e.target.value})} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="premium-btn flex items-center justify-center gap-2 mt-8 h-12 w-full text-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5">
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-semibold"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
