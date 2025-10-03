"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  Headphones, 
  Users, 
  Globe, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Play,
  Volume2,
  Award,
  Shield,
  Zap,
  Menu,
  X,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  FileText,
  Github,
  Twitter,
  Linkedin
} from "lucide-react"

export default function LandingPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: Mic,
      title: "Contribute Voice",
      description: "Record Luo sentences to help build the voice dataset",
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      icon: Headphones,
      title: "Validate Recordings",
      description: "Listen and validate recordings from other contributors",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a community passionate about preserving Luo language",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      icon: Globe,
      title: "Open Source",
      description: "Part of Mozilla's Common Voice initiative",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ]

  const stats = [
    { number: "500+", label: "Sentences Available" },
    { number: "50+", label: "Active Contributors" },
    { number: "1,200+", label: "Recordings Collected" },
    { number: "95%", label: "Quality Score" }
  ]

  const benefits = [
    "Preserve Luo language for future generations",
    "Contribute to open-source voice technology",
    "Help create accessible voice interfaces",
    "Join a global community of language advocates"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Enhanced Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-4 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">CV</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                  Common Voice Luo
                </h1>
                <p className="text-sm text-slate-500 -mt-1 font-medium">mozilla</p>
              </div>
            </div>

            {/* Enhanced Navigation Links */}
            <div className="hidden md:flex items-center space-x-10">
              <Link href="#features" className="relative text-slate-600 hover:text-slate-900 transition-all duration-300 font-semibold group">
                <span className="group-hover:text-blue-600">Features</span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
              <Link href="#about" className="relative text-slate-600 hover:text-slate-900 transition-all duration-300 font-semibold group">
                <span className="group-hover:text-blue-600">About</span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
              <Link href="#stats" className="relative text-slate-600 hover:text-slate-900 transition-all duration-300 font-semibold group">
                <span className="group-hover:text-blue-600">Stats</span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold px-6 py-2.5 transition-all duration-300 hover:scale-105">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 px-8 py-2.5 font-semibold">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-slate-600" />
                ) : (
                  <Menu className="h-6 w-6 text-slate-600" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-md">
              <div className="px-4 py-6 space-y-4">
                <Link 
                  href="#features" 
                  className="block text-slate-600 hover:text-blue-600 font-semibold transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#about" 
                  className="block text-slate-600 hover:text-blue-600 font-semibold transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="#stats" 
                  className="block text-slate-600 hover:text-blue-600 font-semibold transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Stats
                </Link>
                <div className="pt-4 border-t border-slate-200/50 space-y-3">
                  <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Compact Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 py-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="text-center">
            {/* Ultra-Modern Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-200/50 shadow-lg mb-4 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-bold text-slate-700 tracking-wide">Part of Mozilla Common Voice</span>
            </div>

            {/* Ultra-Modern Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                Preserve Luo Language
              </span>
              <br />
              <span className="text-slate-700 font-light">Through Voice Technology</span>
            </h1>

            {/* Ultra-Modern Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed font-medium">
              Join our community in building the world's largest open-source Luo voice dataset. 
              <span className="text-blue-600 font-semibold"> Contribute recordings</span>, 
              <span className="text-indigo-600 font-semibold"> validate others' work</span>, and 
              <span className="text-purple-600 font-semibold"> help preserve</span> this beautiful language for future generations.
            </p>

            {/* Ultra-Modern CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base font-bold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 rounded-lg">
                  Start Contributing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-6 py-3 text-base border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 font-bold transition-all duration-300 hover:scale-105 rounded-lg shadow-lg hover:shadow-xl"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <Play className="mr-2 h-4 w-4" />
                Listen to Luo
              </Button>
            </div>

            {/* Ultra-Modern Audio Player Demo */}
            {isPlaying && (
              <Card className="max-w-md mx-auto mb-4 shadow-lg border-0 bg-white/90 backdrop-blur-xl rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                      <Volume2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-lg mb-1">Sample Luo Recording</p>
                      <p className="text-slate-600 text-sm italic">"Neno mar Luo ni neno mokworo mag piny Kenya"</p>
                      <div className="mt-2 flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        <span className="text-xs text-slate-500 ml-1">Playing...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ultra-Modern Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold">Open Source</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span className="text-xs font-semibold">Privacy First</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span className="text-xs font-semibold">Community Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Stats Section */}
      <section id="stats" className="py-6 bg-gradient-to-br from-white via-slate-50 to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Section Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Our Impact
              </span>
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
              Join thousands of contributors making a real difference in Luo language preservation
            </p>
          </div>

          {/* Compact Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="group text-center">
                <div className="relative mb-3">
                  {/* Animated Background Circle */}
                  <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full mx-auto group-hover:scale-110 transition-all duration-500"></div>
                  
                  {/* Main Stat Number */}
                  <div className="relative text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-all duration-300">
                    {stat.number}
                  </div>
                  
                  {/* Animated Underline */}
                  <div className="w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto group-hover:w-12 transition-all duration-500 rounded-full"></div>
                </div>
                
                {/* Stat Label */}
                <div className="text-slate-600 font-bold text-sm group-hover:text-slate-800 transition-colors duration-300">
                  {stat.label}
                </div>
                
                {/* Progress Indicator */}
                <div className="mt-2 w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${(index + 1) * 25}%`,
                      animationDelay: `${index * 0.2}s`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-600 mb-3 font-medium">
              Be part of our growing community
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base font-bold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 rounded-lg">
                Join the Movement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Compact Features Section */}
      <section id="features" className="py-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-indigo-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-gradient-to-br from-blue-400/15 to-indigo-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Compact Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-200/50 shadow-lg mb-4">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-bold text-slate-700 tracking-wide">How It Works</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Simple Steps,
              </span>
              <br />
              <span className="text-slate-700">Big Impact</span>
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
              Our platform makes it incredibly easy to contribute to Luo language preservation through voice technology. 
              <span className="text-blue-600 font-semibold"> Just follow these simple steps</span> to make a difference.
            </p>
          </div>

          {/* Compact Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/50 hover:border-blue-300/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                  {/* Step Number */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-300">
                    <span className="text-white font-black text-sm">{index + 1}</span>
                  </div>

                  <CardContent className="relative p-4 text-center">
                    {/* Compact Icon Container */}
                    <div className="relative mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Icon className={`w-6 h-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                    </div>
                    
                    {/* Compact Content */}
                    <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium group-hover:text-slate-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Compact Call to Action */}
          <div className="text-center mt-6">
            <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-xl p-6 border border-slate-200/50 backdrop-blur-xl">
              <h3 className="text-xl font-black text-slate-900 mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-sm text-slate-600 mb-4 max-w-xl mx-auto font-medium">
                Join our community and start contributing to Luo language preservation today
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base font-bold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 rounded-lg">
                    Start Contributing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="outline" size="lg" className="px-6 py-3 text-base border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 font-bold transition-all duration-300 hover:scale-105 rounded-lg shadow-lg hover:shadow-xl">
                    Already Have an Account?
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Why Contribute to Luo Voice Data?
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed font-light">
                Language preservation is crucial for cultural heritage. By contributing to our Luo voice dataset, 
                you're helping create technology that can understand and speak Luo, making digital services 
                accessible to Luo speakers worldwide.
              </p>
              
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-700 text-lg font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  Join the Community
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 shadow-xl border border-slate-200">
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl">Privacy First</h3>
                      <p className="text-slate-600 mt-1">Your recordings are used only for language preservation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl">Quality Assured</h3>
                      <p className="text-slate-600 mt-1">Community validation ensures high-quality recordings</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl">Easy to Use</h3>
                      <p className="text-slate-600 mt-1">Simple interface designed for everyone</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact CTA Section */}
      <section className="relative py-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        {/* Minimal Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-white/10 to-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Compact Header */}
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent animate-gradient">
                Ready to Make a Difference?
              </span>
            </h2>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto font-medium">
              Join our community in preserving Luo language through voice technology
            </p>
          </div>

          {/* Compact CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 rounded-xl">
                Start Contributing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-bold transition-all duration-300 rounded-xl">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Compact Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-semibold">50+ Contributors</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-white" />
              <span className="text-white font-semibold">1,200+ Recordings</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-white font-semibold">Privacy First</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-2xl">CV</span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold">Common Voice Luo</h3>
                  <p className="text-slate-400 text-sm font-medium">mozilla</p>
                </div>
              </div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed text-lg">
                Preserving Luo language through open-source voice technology. 
                Part of Mozilla's Common Voice initiative.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center space-x-4">
                <a href="https://github.com/mozilla/common-voice" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors duration-300">
                  <Github className="w-5 h-5 text-white" />
                </a>
                <a href="https://twitter.com/mozcommonvoice" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors duration-300">
                  <Twitter className="w-5 h-5 text-white" />
                </a>
                <a href="https://linkedin.com/company/mozilla" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors duration-300">
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
            
            {/* Platform Section */}
            <div>
              <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                Platform
              </h4>
              <ul className="space-y-3 text-slate-400">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Sign Up
                </Link></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Sign In
                </Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Dashboard
                </Link></li>
                <li><Link href="/speak" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Contribute
                </Link></li>
                <li><Link href="/listen" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Headphones className="w-4 h-4" />
                  Validate
                </Link></li>
              </ul>
            </div>
            
            {/* Help & Support Section */}
            <div>
              <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-green-400" />
                Help & Support
              </h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="mailto:support@commonvoice.mozilla.org" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Support
                </a></li>
                <li><a href="https://discourse.mozilla.org/c/common-voice" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Community Forum
                </a></li>
                <li><a href="https://commonvoice.mozilla.org/help" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentation
                </a></li>
                <li><a href="https://github.com/mozilla/common-voice/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  Report Issues
                </a></li>
                <li><a href="https://commonvoice.mozilla.org/faq" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </a></li>
              </ul>
            </div>
            
            {/* Contact & Resources Section */}
            <div>
              <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                Contact & Resources
              </h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="https://commonvoice.mozilla.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Common Voice
                </a></li>
                <li><a href="https://mozilla.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Mozilla Foundation
                </a></li>
                <li><a href="https://mozilla.org/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </a></li>
                <li><a href="https://mozilla.org/about/legal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </a></li>
                <li><a href="https://mozilla.org/about/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Mozilla
                </a></li>
              </ul>
            </div>
          </div>
          
          {/* Newsletter Signup */}
          <div className="bg-slate-800/50 rounded-2xl p-8 mb-12 border border-slate-700">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
              <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
                Get the latest updates on Luo language preservation and Common Voice initiatives
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                />
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 font-bold rounded-xl transition-all duration-300">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-slate-400 text-center md:text-left">
                <p>&copy; 2025 Common Voice Luo. Part of Mozilla Common Voice initiative.</p>
                <p className="text-sm mt-1">Built with ❤️ for language preservation</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  Privacy First
                </span>
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Open Source
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Community Driven
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
