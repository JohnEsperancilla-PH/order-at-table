import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { 
  QrCode, 
  ShoppingCart, 
  Users, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Smartphone, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  Star,
  Play,
  MessageCircle,
  BarChart3,
  DollarSign,
  Settings,
  Headphones,
  Award,
  Globe
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-16" />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 relative">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="text-sm font-semibold px-4 py-2">
              🚀 The Future of Restaurant Ordering is Here
            </Badge>
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
                QR<span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Der</span>
              </h1>
              <p className="text-3xl md:text-4xl font-semibold text-muted-foreground">
                Scan. Order. Savor.
              </p>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Revolutionize your restaurant with contactless ordering that customers love. 
              <span className="text-foreground font-semibold"> No apps to download</span>, 
              <span className="text-foreground font-semibold"> no waiting for servers</span>, 
              just seamless service that boosts your bottom line.
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 pt-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">35%</div>
                <div className="text-sm text-muted-foreground">Faster Service</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">50%</div>
                <div className="text-sm text-muted-foreground">Reduced Wait Times</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button size="lg" asChild className="text-lg px-8 py-6 h-auto">
                <Link href="/contact">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 h-auto">
                <Link href="#demo">
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-muted/30 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-lg"> Soon to be Trusted by restaurants nationwide</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <div className="text-2xl font-bold">Fast</div>
            <div className="text-2xl font-bold">Reliable</div>
            <div className="text-2xl font-bold">Efficient</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything Your Restaurant Needs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete ordering solution designed for modern restaurants and tech-savvy customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <Card className="border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Instant QR Ordering</CardTitle>
              <CardDescription className="text-base">
                Customers scan and order in under 30 seconds—no app downloads, no account creation required
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Lightning Performance</CardTitle>
              <CardDescription className="text-base">
                Reduce table turnover time by 35% with streamlined ordering and payment flow
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Analytics Dashboard</CardTitle>
              <CardDescription className="text-base">
                Comprehensive insights into order patterns, peak times, and customer preferences
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Mobile Optimized</CardTitle>
              <CardDescription className="text-base">
                Perfect experience across all devices with intuitive touch-friendly interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Menu Management</CardTitle>
              <CardDescription className="text-base">
                Easy-to-use admin panel for updating prices, availability, and menu items in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Enterprise Security</CardTitle>
              <CardDescription className="text-base">
                Bank-level security with encrypted data and compliance with industry standards
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo" className="bg-muted/20 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              See QRDer in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the seamless ordering process your customers will love
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Customer Scans QR Code</h3>
                  <p className="text-muted-foreground">
                    Using any smartphone camera, customers instantly access your menu without downloads
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Browse & Customize</h3>
                  <p className="text-muted-foreground">
                    Beautiful menu interface with photos, descriptions, and customization options
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Place Order</h3>
                  <p className="text-muted-foreground">
                    One-click ordering with real-time kitchen notifications and order tracking
                  </p>
                </div>
              </div>

              <Button size="lg" asChild className="w-full md:w-auto">
                <Link href="/contact">
                  Try Free Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto">
                  <QrCode className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Interactive Demo</h3>
                  <p className="text-muted-foreground mb-6">
                    Experience the full customer journey from scan to order completion
                  </p>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/contact">
                      <Play className="mr-2 h-5 w-5" /> Start Demo
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Restaurant Owners Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Real results from restaurants using QRDer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  "QRDer transformed our service speed. We're serving 40% more customers during peak hours with the same staff."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">MJ</span>
                  </div>
                  <div>
                    <div className="font-semibold">Maria Johnson</div>
                    <div className="text-sm text-muted-foreground">Downtown Bistro</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  "Setup took 5 minutes. Within a week, customer satisfaction scores improved by 25%. It's incredible."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">DL</span>
                  </div>
                  <div>
                    <div className="font-semibold">David Lee</div>
                    <div className="text-sm text-muted-foreground">Fusion Kitchen</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  "Our younger customers love it, and older ones find it surprisingly easy. Win-win for everyone."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">ST</span>
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Thompson</div>
                    <div className="text-sm text-muted-foreground">Family Diner</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/20 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Built for Restaurant Success
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Every feature designed to increase revenue and improve operations
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <DollarSign className="w-7 h-7 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Boost Revenue by 25%</h3>
                    <p className="text-muted-foreground">
                      Faster table turnover, reduced labor costs, and improved order accuracy translate to immediate profit gains
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="w-7 h-7 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Save 3+ Hours Daily</h3>
                    <p className="text-muted-foreground">
                      Eliminate order-taking bottlenecks and free up staff for food prep and customer service
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Award className="w-7 h-7 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Premium Experience</h3>
                    <p className="text-muted-foreground">
                      Customers appreciate the modern, contactless experience and rate service quality higher
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Globe className="w-7 h-7 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Multi-Language Support</h3>
                    <p className="text-muted-foreground">
                      Remove language barriers and serve diverse customers with automatic translation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="p-8 lg:p-12">
              <CardHeader className="text-center pb-8">
                <Badge variant="secondary" className="mx-auto mb-4">
                  Launch Offer
                </Badge>
                <CardTitle className="text-3xl">Start Free for 30 Days</CardTitle>
                <CardDescription className="text-lg pt-2">
                  No setup fees, no contracts, cancel anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">$0</div>
                  <div className="text-muted-foreground">First month free</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Unlimited orders & menu items</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Real-time analytics dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>24/7 customer support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Mobile & tablet optimization</span>
                  </div>
                </div>
                
                <Separator />
                
                <Button size="lg" className="w-full text-lg" asChild>
                  <Link href="/contact">
                    Start Free Trial Today
                  </Link>
                </Button>
                
                <Button size="lg" variant="outline" className="w-full" asChild>
                  <Link href="/contact">
                    <Headphones className="mr-2 h-5 w-5" />
                    Book a Demo Call
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  No credit card required • Setup in under 5 minutes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about QRDer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">How quickly can I set up QRDer?</h3>
                <p className="text-muted-foreground">
                  Setup takes under 5 minutes. Upload your menu, customize your branding, and generate QR codes for each table. You'll be serving customers immediately.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">Do customers need to download an app?</h3>
                <p className="text-muted-foreground">
                  No! QRDer works through any smartphone's web browser. Customers simply scan the QR code with their camera app and start ordering.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">What about customers without smartphones?</h3>
                <p className="text-muted-foreground">
                  Staff can still take orders traditionally. QRDer complements your existing service without replacing it entirely.
                </p>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">How does payment work?</h3>
                <p className="text-muted-foreground">
                  Customers pay at your counter as usual. QRDer focuses on streamlining the ordering process while keeping payment familiar and secure.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">Can I update my menu in real-time?</h3>
                <p className="text-muted-foreground">
                  Yes! Mark items as unavailable, update prices, add daily specials, or modify descriptions instantly from your admin dashboard.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">Is there ongoing support?</h3>
                <p className="text-muted-foreground">
                  Absolutely. We provide 24/7 support via chat, email, and phone. Plus detailed documentation and video tutorials.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Join thousands of restaurants already serving better experiences with QRDer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6 h-auto">
              <Link href="/contact">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 h-auto">
              <Link href="#demo">
                <MessageCircle className="mr-2 h-5 w-5" /> Contact Sales
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-6">
            No commitment • Cancel anytime • Support included
          </p>
        </div>
      </div>
    </div>
  )
}