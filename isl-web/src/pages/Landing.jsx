import React from 'react';
import { Camera, MessageCircle, Users, ArrowRight, Sparkles, Hand, Type, Languages, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/traslate");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-x-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg">
                <Hand className="w-6 h-6 text-purple-300" />
              </div>
              <span className="text-xl font-bold text-white">SignSpeak</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-200">Features</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors duration-200">About</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors duration-200">Contact</a>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                  <span>Welcome, {user.username}!</span>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
              <button
                onClick={handleGetStarted}
                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30"
              >
                {user ? 'Go to App' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 pt-20">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>Breaking Communication Barriers</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transform 
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"> Sign Language </span>
              Into Words
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Convert Indian Sign Language to text in real-time. Enable seamless communication 
              between deaf and hearing communities with AI-powered translation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={handleGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 shadow-2xl"
            >
              <span>Start Translating</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 font-semibold rounded-xl hover:bg-white/20 transition-all duration-300">
              See Demo
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group hover:border-purple-500/30">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg w-fit mb-4 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                <Camera className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Recognition</h3>
              <p className="text-gray-400">Advanced AI technology instantly recognizes and converts ISL gestures to readable text</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group hover:border-blue-500/30">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg w-fit mb-4 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                <MessageCircle className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Two-way Communication</h3>
              <p className="text-gray-400">Users can respond via text, creating a complete conversation flow between both parties</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group hover:border-green-500/30">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg w-fit mb-4 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
                <Users className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Inclusive Design</h3>
              <p className="text-gray-400">Built with accessibility in mind, ensuring everyone can communicate effectively</p>
            </div>
          </div>

          {/* How it Works Section */}
          <div className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hand className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">1. Sign</h3>
                <p className="text-gray-400">Use your camera to capture Indian Sign Language gestures</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Languages className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">2. Translate</h3>
                <p className="text-gray-400">AI instantly converts your signs into readable text</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Type className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">3. Communicate</h3>
                <p className="text-gray-400">Others can read and reply via text for full conversations</p>
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="mt-20 mb-20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-lg rounded-2xl border border-white/10 p-8 hover:border-purple-500/30 transition-all duration-300">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Bridge the Communication Gap?</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join our mission to make communication accessible for everyone. Start using SignSpeak today and experience the power of inclusive technology.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Launch SignSpeak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}