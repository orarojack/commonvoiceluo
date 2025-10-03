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
  X
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
              <div>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm mb-6">
              <Star className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">Part of Mozilla Common Voice</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Preserve Luo Language
              </span>
              <br />
              <span className="text-slate-700">Through Voice Technology</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed font-light">
              Join our community in building the world's largest open-source Luo voice dataset. 
              Contribute recordings, validate others' work, and help preserve this beautiful language for future generations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  Start Contributing
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-10 py-6 text-lg border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 font-semibold transition-all duration-300"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <Play className="mr-3 h-5 w-5" />
                Listen to Luo
              </Button>
            </div>

            {/* Audio Player Demo */}
            {isPlaying && (
              <Card className="max-w-lg mx-auto mb-8 shadow-xl border-0 bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Volume2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-lg">Sample Luo Recording</p>
                      <p className="text-slate-600 mt-1">"Neno mar Luo ni neno mokworo mag piny Kenya"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 font-semibold text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light">
              Our platform makes it easy to contribute to Luo language preservation through voice technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className={`${feature.bgColor} ${feature.borderColor} border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className={`w-10 h-10 ${feature.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
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

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
            Join thousands of contributors worldwide in preserving Luo language through voice technology
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-slate-50 px-12 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                Start Contributing Today
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-blue-600 px-12 py-6 text-lg font-semibold transition-all duration-300">
                Already Have an Account?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">CV</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Common Voice Luo</h3>
                  <p className="text-slate-400 text-sm">mozilla</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4 max-w-md leading-relaxed">
                Preserving Luo language through open-source voice technology. 
                Part of Mozilla's Common Voice initiative.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="https://commonvoice.mozilla.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Common Voice</a></li>
                <li><a href="https://mozilla.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Mozilla</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-slate-400">
            <p>&copy; 2025 Common Voice Luo. Part of Mozilla Common Voice initiative.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
