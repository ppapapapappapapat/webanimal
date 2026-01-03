'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SplashScreen from './components/SplashScreen';
import { useUser } from './context/UserContext';
import { FaCamera, FaDatabase, FaSearch, FaBrain, FaChartBar, FaEye } from 'react-icons/fa';
import { GiEagleHead, GiMammoth } from 'react-icons/gi';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, router]);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-green-900 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center relative">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-sm border border-white/10">
              <GiEagleHead className="text-yellow-400 text-xl" />
              <span className="text-white font-medium">Philippine Wildlife Conservation</span>
              <GiMammoth className="text-yellow-400 text-xl" />
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-green-400">
                Protect Endangered
              </span>
              <br />
              <span className="text-white">Philippine Wildlife</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-12 leading-relaxed">
              AI-powered real-time detection and awareness system for endangered 
              <span className="text-yellow-300"> birds</span> and 
              <span className="text-yellow-300"> mammals</span> using YOLOv8 machine learning
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link 
                href="/animal-detection" 
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 text-white font-bold text-lg"
              >
                <FaCamera className="text-xl" />
                Try Animal Detection
              </Link>
              <Link 
                href="/endangered-species" 
                className="group px-8 py-4 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 text-white font-bold text-lg"
              >
                <FaDatabase className="text-xl" />
                Browse Species Database
              </Link>
            </div>
          </div>
        </section>

        {/* Core Modules Section */}
        <section className="py-16 md:py-24 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">AI-Powered</span> Modules
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Two specialized systems working together for wildlife conservation
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Animal Detection Card */}
              <div className="group relative bg-gradient-to-br from-gray-900 to-blue-900/30 rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                  <FaSearch className="text-3xl text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                  <FaCamera className="text-blue-400" />
                  Animal Detection Module
                </h3>
                
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Real-time detection of endangered Philippine species using state-of-the-art YOLOv8 computer vision
                </p>
                
                <ul className="space-y-4 mb-8">
                  {['Instant species identification', 'Health condition screening', 'Population estimation', 'Habitat analysis'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link 
                  href="/animal-detection" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-lg text-white font-medium transition-all duration-300 transform group-hover:translate-x-2"
                >
                  Launch Detection <span className="text-xl">→</span>
                </Link>
              </div>
              
              {/* Species Database Card */}
              <div className="group relative bg-gradient-to-br from-gray-900 to-green-900/30 rounded-2xl p-8 border border-green-500/30 hover:border-green-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-2xl">
                  <FaDatabase className="text-3xl text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                  <FaEye className="text-green-400" />
                  Species Awareness Module
                </h3>
                
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Comprehensive database with detailed profiles of all endangered wildlife in the Philippines
                </p>
                
                <ul className="space-y-4 mb-8">
                  {['IUCN Red List integration', 'Detailed species profiles', 'Conservation status', 'Sighting reports'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link 
                  href="/endangered-species" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 rounded-lg text-white font-medium transition-all duration-300 transform group-hover:translate-x-2"
                >
                  Explore Database <span className="text-xl">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                How Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">System Works</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Three simple steps to contribute to wildlife conservation
              </p>
            </div>
            
            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: 1,
                    icon: <FaCamera className="text-3xl" />,
                    title: "Capture & Upload",
                    desc: "Upload images or videos of wildlife encounters",
                    color: "blue"
                  },
                  {
                    step: 2,
                    icon: <FaBrain className="text-3xl" />,
                    title: "AI Analysis",
                    desc: "YOLOv8 model processes and identifies species",
                    color: "purple"
                  },
                  {
                    step: 3,
                    icon: <FaChartBar className="text-3xl" />,
                    title: "Get Insights",
                    desc: "Receive detailed conservation data and reports",
                    color: "green"
                  }
                ].map((item) => (
                  <div key={item.step} className="relative">
                    <div className={`bg-gradient-to-br from-gray-900 to-${item.color}-900/20 rounded-2xl p-8 border border-${item.color}-500/30 hover:border-${item.color}-500/50 transition-all duration-500 group`}>
                      <div className={`w-20 h-20 bg-gradient-to-br from-${item.color}-600 to-${item.color}-800 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                        <div className="text-white">
                          {item.icon}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-${item.color}-500 text-white font-bold mb-4`}>
                          {item.step}
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-white">{item.title}</h3>
                        <p className="text-gray-300">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-green-900/30 rounded-3xl p-12 border border-white/10 backdrop-blur-sm">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                Ready to Make a <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">Difference</span>?
              </h2>
              
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join our mission to protect endangered Philippine wildlife through AI-powered technology and community awareness.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link 
                  href="/animal-detection" 
                  className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 text-white font-bold text-lg"
                >
                  <FaCamera className="text-xl" />
                  Start Detection Now
                  <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                </Link>
                
                <Link 
                  href="/endangered-species" 
                  className="group px-10 py-5 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 rounded-xl shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 text-white font-bold text-lg"
                >
                  <FaDatabase className="text-xl" />
                  Explore Species
                  <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                </Link>
              </div>
              
              <p className="text-gray-400 mt-12 text-lg">
                Together, we can preserve Philippine biodiversity for future generations.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}