import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

const features = [
  {
    icon: TrendingUp,
    title: 'Smart Analysis',
    description: 'AI-powered insights for Indian equities with real-time market data.',
  },
  {
    icon: Shield,
    title: 'Portfolio Aware',
    description: 'Personalized recommendations based on your holdings and risk profile.',
  },
  {
    icon: Zap,
    title: 'Instant Insights',
    description: 'Get comprehensive stock analysis in seconds, not hours.',
  },
  {
    icon: BarChart3,
    title: 'Long & Short Term',
    description: 'Analysis tailored for both investment horizons and trading styles.',
  },
];

export default function Landing() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background" />
        
        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              KUBERA
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              AI-Powered Stock Analysis
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Your intelligent assistant for Indian equity markets. Get personalized 
              portfolio recommendations and comprehensive stock analysis powered by AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth/register">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/auth/login">
                  Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Intelligent Investment Insights
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to make informed investment decisions in the Indian stock market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-lg bg-card border border-border hover:border-ring/50 hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Start Analyzing Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join investors who trust KUBERA for AI-powered stock analysis and portfolio insights.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth/register">
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} KUBERA. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>AI-Powered Stock Analysis</span>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
