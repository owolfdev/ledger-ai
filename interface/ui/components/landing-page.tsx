"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Terminal,
  Zap,
  Shield,
  BarChart3,
  Users,
  Download,
  Check,
  ArrowRight,
  Github,
  Twitter,
  Mail,
} from "lucide-react"

const features = [
  {
    icon: Terminal,
    title: "Smart Terminal Interface",
    description: "Command-line first approach with AI-powered natural language processing for rapid data entry.",
  },
  {
    icon: Zap,
    title: "AI-Powered Suggestions",
    description: "Intelligent account mapping and transaction categorization that learns from your patterns.",
  },
  {
    icon: BarChart3,
    title: "Advanced Reporting",
    description: "Generate P&L, Balance Sheet, Cash Flow, and custom reports with real-time insights.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Enterprise-level security with encryption, audit logs, and role-based access control.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Multi-user support with granular permissions and real-time collaboration features.",
  },
  {
    icon: Download,
    title: "Data Portability",
    description: "Export your data in standard formats. No vendor lock-in, your data stays yours.",
  },
]

const steps = [
  {
    step: "01",
    title: "Connect Your Data",
    description: "Import existing data or start fresh. Upload receipts and connect your accounts securely.",
  },
  {
    step: "02",
    title: "Use Smart Terminal",
    description:
      "Enter transactions using commands or natural language. AI learns your patterns and suggests accounts.",
  },
  {
    step: "03",
    title: "Generate Reports",
    description: "Get instant insights with automated reports. Export data anytime in standard formats.",
  },
]

const plans = [
  {
    name: "Starter",
    price: 9,
    description: "Perfect for freelancers and small businesses",
    features: [
      "Up to 100 transactions/month",
      "Basic reports (P&L, Balance Sheet)",
      "Email support",
      "1 team member",
      "Data export",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: 29,
    description: "For growing businesses and teams",
    features: [
      "Up to 1,000 transactions/month",
      "Advanced reports & analytics",
      "Priority support",
      "5 team members",
      "API access",
      "Custom exports",
      "Receipt OCR",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 99,
    description: "For large organizations",
    features: [
      "Unlimited transactions",
      "Custom reports & dashboards",
      "Dedicated support",
      "Unlimited team members",
      "Advanced API",
      "Custom integrations",
      "SSO & advanced security",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const faqs = [
  {
    question: "What makes Ledger AI different from other accounting software?",
    answer:
      "Ledger AI is built for developers and power users who prefer command-line interfaces. Our AI-powered terminal allows for rapid data entry using natural language or structured commands, making accounting as efficient as coding.",
  },
  {
    question: "Can I import data from other accounting systems?",
    answer:
      "Yes! Ledger AI supports standard .ledger format imports and can handle data from most accounting systems. We also provide migration tools and support to help you transition smoothly.",
  },
  {
    question: "Is my financial data secure?",
    answer:
      "Absolutely. We use bank-grade encryption, maintain SOC 2 compliance, and provide detailed audit logs. Your data is encrypted at rest and in transit, and we never share it with third parties.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes! All plans come with a 14-day free trial. No credit card required. You can explore all features and see if Ledger AI fits your workflow before committing.",
  },
  {
    question: "Can I export my data if I decide to leave?",
    answer:
      "Of course! We believe in data portability. You can export your complete accounting data in standard .ledger format at any time. No vendor lock-in, your data stays yours.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We offer email support for all plans, priority support for Pro users, and dedicated support for Enterprise customers. Our team includes accounting experts and developers who understand your needs.",
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Ledger AI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
            <Button variant="outline" asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
            <Button asChild>
              <a href="/auth/signup">Start Free Trial</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge variant="secondary" className="mb-4">
            Now in Public Beta
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Smart Terminal Accounting
            <br />
            <span className="text-primary">Built for Developers</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance">
            The first accounting system designed for command-line lovers. Use AI-powered natural language processing or
            structured commands to manage your finances with developer-grade precision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <a href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#demo">View Demo</a>
            </Button>
          </div>

          {/* Terminal Preview */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-900 text-green-400 font-mono text-sm">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">$</span>
                    <span>ex -i coffee 5.50 -v "Starbucks"</span>
                  </div>
                  <div className="text-slate-400">✓ Created expense entry: Coffee at Starbucks ($5.50)</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">$</span>
                    <span>I bought lunch for $12 at the deli</span>
                  </div>
                  <div className="text-blue-400">✨ AI Generated: ex -i lunch 12.00 -v "Local Deli"</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">$</span>
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with Ledger AI in three simple steps. No complex setup, just intelligent accounting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for professional accounting, designed with developer workflows in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader>
                    <Icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See It In Action</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Clean, intuitive interface that gets out of your way and lets you focus on your finances.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 p-8 h-64 flex items-center justify-center">
                <div className="text-center">
                  <Terminal className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Smart Terminal</h3>
                  <p className="text-sm text-muted-foreground">Command-line interface with AI assistance</p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-8 h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Advanced Reports</h3>
                  <p className="text-sm text-muted-foreground">Real-time insights and analytics</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border-border"}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Everything you need to know about Ledger AI</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Accounting?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers and businesses who've made the switch to intelligent accounting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:hello@ledger-ai.com">Contact Sales</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Terminal className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Ledger AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Smart terminal accounting built for developers and modern businesses.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/docs" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/api" className="hover:text-foreground transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/about" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/security" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="/compliance" className="hover:text-foreground transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Ledger AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
