import Link from "next/link";
import {
  Shield,
  Dumbbell,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Pill,
  BarChart2,
  MessageSquare,
  Zap,
  Clock,
  ChevronDown,
  Star,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";

const features = [
  {
    icon: Dumbbell,
    title: "Dose-Adjusted Protein Targets",
    description:
      "Your protein needs change with every dose increase. MuscleGuard calculates your daily target using your weight, your goals, and your specific GLP-1 dose multiplier, so you always know exactly what to aim for.",
  },
  {
    icon: Sparkles,
    title: "Smart Meal Planner",
    description:
      "Answer 3 quick questions about your appetite and get high-protein meal ideas in small, manageable portions. Built specifically for users experiencing appetite suppression on GLP-1 medications.",
  },
  {
    icon: Activity,
    title: "Smart Training Protocols",
    description:
      "Choose from 8 sport types, each with GLP-1-specific intensity adjustments. Resistance training helps signal your body to preserve muscle during weight loss, and MuscleGuard adapts your plan to how you feel each day.",
  },
  {
    icon: Pill,
    title: "Medication Tracker",
    description:
      "Log your injections, track dose changes, and receive automated email reminders with 3 escalation levels so you never miss a dose. When your dose changes, your entire plan updates automatically.",
  },
  {
    icon: BarChart2,
    title: "Progress Analytics",
    description:
      "Interactive charts track your weight, body composition, and protein intake over time, with dose-change markers so you can see exactly how medication adjustments affect your progress.",
  },
  {
    icon: TrendingUp,
    title: "Weekly Reports",
    description:
      "Get a clear A/B/C grade each week across protein consistency and training completion. Know exactly where you stand and what to focus on next with a personalized weekly summary.",
  },
  {
    icon: MessageSquare,
    title: "Personalized Communication",
    description:
      "Choose from 5 communication styles, from gentle encouragement to direct accountability. MuscleGuard adapts its tone across every section of the app to match what motivates you best.",
  },
];

const comparisonRows = [
  {
    name: "MuscleGuard",
    glp1: true,
    doseProtein: true,
    mealPlanner: true,
    training: true,
    medReminders: true,
    price: "$14.99/mo",
    highlight: true,
  },
  {
    name: "MyFitnessPal",
    glp1: false,
    doseProtein: false,
    mealPlanner: false,
    training: false,
    medReminders: false,
    price: "$9.99/mo",
    highlight: false,
  },
  {
    name: "Noom Med",
    glp1: true,
    doseProtein: false,
    mealPlanner: false,
    training: false,
    medReminders: false,
    price: "$149+/mo",
    highlight: false,
  },
  {
    name: "Calibrate",
    glp1: true,
    doseProtein: false,
    mealPlanner: false,
    training: true,
    medReminders: false,
    price: "$199/mo",
    highlight: false,
  },
  {
    name: "MacroFactor",
    glp1: false,
    doseProtein: false,
    mealPlanner: false,
    training: false,
    medReminders: false,
    price: "$11.99/mo",
    highlight: false,
  },
];

const faqs = [
  {
    q: "Who is MuscleGuard for?",
    a: "MuscleGuard is designed for anyone taking GLP-1 medications such as Ozempic, Wegovy, Mounjaro, or Zepbound who wants to preserve lean muscle during weight loss. Whether you are a gym-goer, a runner, a swimmer, or someone just getting started with fitness, MuscleGuard adapts to your activity level and gives you a plan that fits your lifestyle and your specific dose.",
  },
  {
    q: "Is MuscleGuard a medical app?",
    a: "No. MuscleGuard is a wellness tool designed to support your nutrition and fitness goals. It is not a medical device and does not diagnose, treat, cure, or prevent any disease. Always consult your healthcare provider about your GLP-1 medication and exercise plan.",
  },
  {
    q: "Which GLP-1 medications does MuscleGuard support?",
    a: "MuscleGuard is designed to support users on semaglutide (Ozempic, Wegovy) and tirzepatide (Mounjaro, Zepbound). The dose-adjusted protein formula accounts for the appetite suppression profile of each medication at every dose level.",
  },
  {
    q: "Do I need to enter a credit card for the free trial?",
    a: "Yes. Your 7-day free trial requires a payment method on file. You will not be charged during the trial period. If you cancel before the trial ends, you will not be billed. After the trial, your subscription renews at $14.99/month.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your Settings page through the Stripe billing portal. There are no long-term contracts, no cancellation fees, and your access continues until the end of your current billing period.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-600" />
            <span className="font-bold text-lg text-gray-900">MuscleGuard</span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <Shield className="h-3.5 w-3.5" /> The only app built for GLP-1 muscle protection
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
          Up to 40% of your weight loss<br />
          could be <span className="text-red-500">muscle, not fat.</span>
        </h1>
        <p className="text-xl text-gray-500 mt-8 max-w-2xl mx-auto leading-relaxed">
          GLP-1 medications like Ozempic, Wegovy, and Mounjaro suppress your appetite, but eating
          too little protein can cost you the lean muscle you have worked to build. MuscleGuard
          is designed to support you in hitting your dose-adjusted protein targets every day.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link href="/login">
            <Button size="lg" className="px-10 text-base h-12">
              Start free trial <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          7-day free trial · $14.99/mo after trial · Cancel anytime
        </p>
      </section>

      {/* Pain Point */}
      <section className="bg-red-50 border-y border-red-100">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div className="flex items-start gap-5">
            <AlertTriangle className="h-7 w-7 text-red-500 mt-1 shrink-0" />
            <p className="font-semibold text-red-900 text-lg leading-relaxed">
              Thousands of posts across Reddit, TikTok, and GLP-1 communities share the same
              story: dramatic weight loss followed by unexpected muscle loss, weakness, and
              metabolic slowdown. The pattern is consistent, and most users say the same
              thing: nobody warned them about protein.
            </p>
          </div>
          <div className="mt-8 p-5 bg-white/70 rounded-xl border border-red-100">
            <p className="text-gray-700 text-sm leading-relaxed">
              <span className="font-semibold text-gray-900">The research confirms it:</span>{" "}
              Clinical studies show that up to 40% of weight lost on GLP-1 medications can come from
              lean muscle, not fat (Wilding et al., STEP trials). Without adequate protein
              intake and resistance training, the weight you lose may include the muscle
              that keeps you strong, metabolically healthy, and functional.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Explained */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          The problem nobody is talking about
        </h2>
        <p className="text-gray-500 text-center max-w-2xl mx-auto mb-14">
          GLP-1 medications are transformative for weight loss, but the muscle loss side of the
          equation is often overlooked.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl border bg-white space-y-4">
            <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Your doctor may not mention it</h3>
            <p className="text-gray-500 leading-relaxed">
              Most prescribing physicians focus on weight and metabolic markers. Detailed protein
              guidance adjusted to your specific GLP-1 dose is rarely part of the conversation,
              and this is an area where many patients feel unsupported.
            </p>
          </div>
          <div className="p-8 rounded-2xl border bg-white space-y-4">
            <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Other apps are not built for this</h3>
            <p className="text-gray-500 leading-relaxed">
              Generic calorie trackers do not account for GLP-1 appetite suppression,
              dose-specific protein multipliers, or the unique training considerations
              that come with these medications.
            </p>
          </div>
          <div className="p-8 rounded-2xl border bg-white space-y-4">
            <div className="h-12 w-12 bg-brand-50 rounded-xl flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Your muscles need a signal to stay</h3>
            <p className="text-gray-500 leading-relaxed">
              When you eat in a caloric deficit, your body can break down muscle for energy.
              Adequate protein plus resistance training helps send the biological signal to
              preserve lean mass during weight loss.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Everything you need to protect your muscle
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto mb-14">
            7 integrated tools designed to support GLP-1 users in preserving lean mass
            during their weight loss journey.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl border bg-white space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="h-11 w-11 bg-brand-50 rounded-xl flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          How MuscleGuard compares
        </h2>
        <p className="text-gray-500 text-center max-w-2xl mx-auto mb-12">
          Most fitness apps were not designed for the unique challenges of GLP-1-assisted
          weight loss. Here is how the landscape looks.
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-4 px-4 font-medium text-gray-500">App</th>
                <th className="text-center py-4 px-3 font-medium text-gray-500">GLP-1 Aware</th>
                <th className="text-center py-4 px-3 font-medium text-gray-500">Dose-Adjusted Protein</th>
                <th className="text-center py-4 px-3 font-medium text-gray-500">Meal Planner</th>
                <th className="text-center py-4 px-3 font-medium text-gray-500">Training Plan</th>
                <th className="text-center py-4 px-3 font-medium text-gray-500">Med Reminders</th>
                <th className="text-center py-4 px-3 font-medium text-gray-500">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comparisonRows.map((row) => (
                <tr
                  key={row.name}
                  className={row.highlight ? "bg-brand-50" : ""}
                >
                  <td
                    className={`py-4 px-4 font-medium ${
                      row.highlight ? "text-brand-800" : "text-gray-700"
                    }`}
                  >
                    {row.highlight && (
                      <Shield className="h-3.5 w-3.5 inline mr-1.5 text-brand-600" />
                    )}
                    {row.name}
                  </td>
                  {[row.glp1, row.doseProtein, row.mealPlanner, row.training, row.medReminders].map(
                    (val, i) => (
                      <td key={i} className="text-center py-4 px-3">
                        {val ? (
                          <CheckCircle2 className="h-5 w-5 text-brand-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300 text-xs">Not available</span>
                        )}
                      </td>
                    )
                  )}
                  <td className="text-center py-4 px-3 text-gray-600 font-medium">{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Comparison based on publicly available information as of April 2026.
          Features and pricing may have changed.
        </p>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Get started in 3 minutes
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14">
            No complex setup. No overwhelming dashboards. Just the information you need.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: Star,
                title: "Sign up",
                description:
                  "Create your account and start your 7-day free trial. Takes less than a minute.",
              },
              {
                step: "2",
                icon: Clock,
                title: "Complete onboarding",
                description:
                  "Answer 3 quick screens about your medication, your current weight, and your activity preferences.",
              },
              {
                step: "3",
                icon: Zap,
                title: "Get your personalized plan",
                description:
                  "Receive your dose-adjusted protein target, personalized meal suggestions, and a training protocol tailored to your sport.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="text-center">
                  <div className="h-14 w-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold mb-5">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Real people, real results
        </h2>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
          Hear from GLP-1 users who are protecting their muscle with MuscleGuard.
        </p>
        <TestimonialCarousel />
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-lg mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Simple, transparent pricing
          </h2>
          <div className="rounded-2xl border-2 border-brand-600 bg-white overflow-hidden shadow-lg">
            <div className="bg-brand-600 text-white text-center py-2 text-sm font-medium">
              7-day free trial included
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900">MuscleGuard Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">$14.99</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">after 7-day free trial</p>
              <ul className="mt-8 space-y-3">
                {[
                  "Dose-adjusted daily protein targets",
                  "Smart meal planner for suppressed appetites",
                  "8 sport-specific training protocols",
                  "Medication tracking with email reminders",
                  "Progress charts with dose-change markers",
                  "Weekly A/B/C performance reports",
                  "5 communication style options",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-brand-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block mt-8">
                <Button size="lg" className="w-full text-base h-12">
                  Start free trial <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <p className="text-xs text-gray-400 text-center mt-3">
                Cancel anytime from your Settings page
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="divide-y">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium text-gray-900">{faq.q}</span>
                <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-gray-500 mt-3 leading-relaxed text-sm">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-600">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white">
            Protect the muscle you have worked for.
          </h2>
          <p className="text-brand-100 mt-4 text-lg max-w-xl mx-auto">
            Your GLP-1 medication is helping you lose weight. MuscleGuard is designed to
            help you make sure it is the right kind of weight.
          </p>
          <Link href="/login" className="inline-block mt-8">
            <Button
              size="lg"
              className="bg-white text-brand-700 hover:bg-brand-50 px-10 text-base h-12"
            >
              Start your free trial <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <p className="text-brand-200 text-sm mt-4">
            7-day free trial · $14.99/mo after · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-brand-600" />
                <span className="font-bold text-gray-900">MuscleGuard</span>
              </div>
              <p className="text-sm text-gray-400 max-w-xs">
                A wellness tool designed to support GLP-1 medication users in
                preserving lean muscle during weight loss.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <Link href="/legal/terms" className="hover:text-gray-900 transition-colors">
                Terms of Use
              </Link>
              <Link href="/legal/privacy" className="hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/cookies" className="hover:text-gray-900 transition-colors">
                Cookie Policy
              </Link>
              <Link href="/legal/refund" className="hover:text-gray-900 transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t">
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-500">Medical Disclaimer:</span>{" "}
              MuscleGuard is not a medical device and is not intended to diagnose, treat, cure,
              or prevent any disease. The information provided by MuscleGuard is for educational
              and informational purposes only and is not a substitute for professional medical
              advice. Always consult your healthcare provider before making changes to your
              diet, exercise routine, or medication regimen. Individual results may vary.
              Testimonials reflect individual experiences and are not guaranteed outcomes.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              &copy; {new Date().getFullYear()} MuscleGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
