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
  Check,
} from "lucide-react";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import { MuscleChart } from "@/components/landing/MuscleChart";

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
    <div className="min-h-screen bg-[#f7f7f7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "MuscleGuard",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web",
            description:
              "Preserve lean muscle during GLP-1 weight loss with dose-adjusted protein targets, smart meal planning, and training protocols.",
            url: "https://muscleguard.app",
            offers: {
              "@type": "Offer",
              price: "14.99",
              priceCurrency: "USD",
              priceValidUntil: "2027-12-31",
            },
          }),
        }}
      />
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#131413]" />
            <span className="font-semibold text-lg text-[#131413] tracking-tight">MuscleGuard</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-[#131413] border border-black/10 rounded-lg hover:bg-[#f7f7f7] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-28 text-center">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase mb-8">
            The only app built for GLP-1 muscle protection
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-[#131413] leading-[1.1] tracking-tight">
            Up to 40% of your weight loss<br />
            could be <span className="bg-[#CDFF00] text-[#131413] px-2 py-0.5">muscle, not fat.</span>
          </h1>
          <p className="text-lg text-[#585A59] mt-8 max-w-2xl mx-auto leading-relaxed">
            GLP-1 medications like Ozempic, Wegovy, and Mounjaro suppress your appetite, but eating
            too little protein can cost you the lean muscle you have worked to build. MuscleGuard
            is designed to support you in hitting your dose-adjusted protein targets every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-3.5 bg-[#131413] text-white text-base font-medium rounded-lg hover:bg-[#202222] transition-colors"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-sm text-[#585A59] mt-4">
            7-day free trial · $14.99/mo after trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Pain Point */}
      <section className="bg-[#131413]">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div className="flex items-start gap-5">
            <AlertTriangle className="h-7 w-7 text-[#CDFF00] mt-1 shrink-0" />
            <p className="font-medium text-white text-lg leading-relaxed">
              Thousands of posts across Reddit, TikTok, and GLP-1 communities share the same
              story: dramatic weight loss followed by unexpected muscle loss, weakness, and
              metabolic slowdown. The pattern is consistent, and most users say the same
              thing: nobody warned them about protein.
            </p>
          </div>
          <div className="mt-8 p-5 bg-white/5 rounded-[10px] border border-white/10">
            <p className="text-[#BFC1C0] text-sm leading-relaxed">
              <span className="font-semibold text-[#CDFF00]">The research confirms it:</span>{" "}
              Clinical studies show that up to 40% of weight lost on GLP-1 medications can come from
              lean muscle, not fat (Wilding et al., STEP trials). Without adequate protein
              intake and resistance training, the weight you lose may include the muscle
              that keeps you strong, metabolically healthy, and functional.
            </p>
          </div>
        </div>
      </section>

      {/* Animated Chart */}
      <section className="bg-[#131413]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            The science
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-white text-center mb-4 tracking-tight">
            Same weight loss. Very different outcomes.
          </h2>
          <p className="text-white/50 text-center max-w-xl mx-auto mb-12">
            Both lines show the same weight loss on GLP-1. The difference is what you lose.
            Without adequate protein and resistance training, a significant portion of that
            weight loss comes from lean muscle.
          </p>
          <MuscleChart />
        </div>
      </section>

      {/* The Problem Explained */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            Why this matters
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            The problem nobody is talking about
          </h2>
          <p className="text-[#585A59] text-center max-w-2xl mx-auto mb-16">
            GLP-1 medications are transformative for weight loss, but the muscle loss side of the
            equation is often overlooked.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[10px] border border-black/5 bg-white space-y-4">
              <div className="h-12 w-12 bg-[#131413] rounded-[10px] flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-[#CDFF00]" />
              </div>
              <h3 className="font-medium text-[#131413] text-lg">Your doctor may not mention it</h3>
              <p className="text-[#585A59] leading-relaxed">
                Most prescribing physicians focus on weight and metabolic markers. Detailed protein
                guidance adjusted to your specific GLP-1 dose is rarely part of the conversation,
                and this is an area where many patients feel unsupported.
              </p>
            </div>
            <div className="p-8 rounded-[10px] border border-black/5 bg-white space-y-4">
              <div className="h-12 w-12 bg-[#131413] rounded-[10px] flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#CDFF00]" />
              </div>
              <h3 className="font-medium text-[#131413] text-lg">Other apps are not built for this</h3>
              <p className="text-[#585A59] leading-relaxed">
                Generic calorie trackers do not account for GLP-1 appetite suppression,
                dose-specific protein multipliers, or the unique training considerations
                that come with these medications.
              </p>
            </div>
            <div className="p-8 rounded-[10px] border border-black/5 bg-white space-y-4">
              <div className="h-12 w-12 bg-[#131413] rounded-[10px] flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-[#CDFF00]" />
              </div>
              <h3 className="font-medium text-[#131413] text-lg">Your muscles need a signal to stay</h3>
              <p className="text-[#585A59] leading-relaxed">
                When you eat in a caloric deficit, your body can break down muscle for energy.
                Adequate protein plus resistance training helps send the biological signal to
                preserve lean mass during weight loss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f7f7f7]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            Built for GLP-1 users
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            Everything you need to protect your muscle
          </h2>
          <p className="text-[#585A59] text-center max-w-2xl mx-auto mb-16">
            7 integrated tools designed to support GLP-1 users in preserving lean mass
            during their weight loss journey.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-[10px] border border-black/5 bg-white space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="h-11 w-11 bg-[#f7f7f7] rounded-[10px] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#131413]" />
                  </div>
                  <h3 className="font-medium text-[#131413] text-lg">{f.title}</h3>
                  <p className="text-[#585A59] leading-relaxed text-sm">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            See the difference
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            How MuscleGuard compares
          </h2>
          <p className="text-[#585A59] text-center max-w-2xl mx-auto mb-14">
            Most fitness apps were not designed for the unique challenges of GLP-1-assisted
            weight loss. Here is how the landscape looks.
          </p>
          <div className="overflow-x-auto rounded-[10px] border border-black/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f7f7f7] border-b border-black/5">
                  <th className="text-left py-4 px-4 font-medium text-[#585A59]">App</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">GLP-1 Aware</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">Dose-Adjusted Protein</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">Meal Planner</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">Training Plan</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">Med Reminders</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {comparisonRows.map((row) => (
                  <tr
                    key={row.name}
                    className={row.highlight ? "bg-[#f7f7f7]" : ""}
                  >
                    <td
                      className={`py-4 px-4 font-medium ${
                        row.highlight ? "text-[#131413]" : "text-[#585A59]"
                      }`}
                    >
                      {row.highlight && (
                        <Shield className="h-3.5 w-3.5 inline mr-1.5 text-[#131413]" />
                      )}
                      {row.name}
                    </td>
                    {[row.glp1, row.doseProtein, row.mealPlanner, row.training, row.medReminders].map(
                      (val, i) => (
                        <td key={i} className="text-center py-4 px-3">
                          {val ? (
                            <Check className={`h-5 w-5 mx-auto ${row.highlight ? "text-[#131413]" : "text-[#131413] opacity-40"}`} />
                          ) : (
                            <span className="text-[#BFC1C0] text-xs">Not available</span>
                          )}
                        </td>
                      )
                    )}
                    <td className="text-center py-4 px-3 text-[#585A59] font-medium">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#BFC1C0] mt-4 text-center">
            Comparison based on publicly available information as of April 2026.
            Features and pricing may have changed.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#f7f7f7]">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            Get started
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            Set up in 3 minutes
          </h2>
          <p className="text-[#585A59] text-center max-w-xl mx-auto mb-16">
            No complex setup. No overwhelming dashboards. Just the information you need.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign up",
                description:
                  "Create your account and start your 7-day free trial. Takes less than a minute.",
              },
              {
                step: "2",
                title: "Complete onboarding",
                description:
                  "Answer 3 quick screens about your medication, your current weight, and your activity preferences.",
              },
              {
                step: "3",
                title: "Get your personalized plan",
                description:
                  "Receive your dose-adjusted protein target, personalized meal suggestions, and a training protocol tailored to your sport.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="h-14 w-14 bg-[#131413] text-white rounded-[10px] flex items-center justify-center mx-auto text-xl font-medium mb-5">
                  {s.step}
                </div>
                <h3 className="font-medium text-[#131413] text-lg mb-2">{s.title}</h3>
                <p className="text-[#585A59] leading-relaxed text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            What users are saying
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            Real people, real results
          </h2>
          <p className="text-[#585A59] text-center max-w-xl mx-auto mb-14">
            Hear from GLP-1 users who are protecting their muscle with MuscleGuard.
          </p>
          <TestimonialCarousel />
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#f7f7f7]">
        <div className="max-w-lg mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            Choose your path
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-14 tracking-tight">
            Simple, transparent pricing
          </h2>
          <div className="rounded-[10px] bg-white border border-black/5 overflow-hidden">
            <div className="bg-[#CDFF00] text-[#131413] text-center py-2.5 text-sm font-medium tracking-wide">
              7-day free trial included
            </div>
            <div className="p-8">
              <h3 className="text-lg font-medium text-[#131413]">MuscleGuard Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-medium text-[#131413]">$14.99</span>
                <span className="text-[#585A59]">/mo</span>
              </div>
              <p className="text-sm text-[#BFC1C0] mt-1">after 7-day free trial</p>
              <ul className="mt-8 space-y-4">
                {[
                  "Dose-adjusted daily protein targets",
                  "Smart meal planner for suppressed appetites",
                  "8 sport-specific training protocols",
                  "Medication tracking with email reminders",
                  "Progress charts with dose-change markers",
                  "Weekly A/B/C performance reports",
                  "5 communication style options",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#585A59]">
                    <Check className="h-5 w-5 text-[#131413] shrink-0 opacity-50" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 mt-8 w-full py-3.5 bg-[#131413] text-white font-medium rounded-lg hover:bg-[#202222] transition-colors"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-[#BFC1C0] text-center mt-3">
                Cancel anytime from your Settings page
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            Questions
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-14 tracking-tight">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-black/5">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-6">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-[#131413]">{faq.q}</span>
                  <ChevronDown className="h-5 w-5 text-[#BFC1C0] group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-[#585A59] mt-4 leading-relaxed text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#131413]">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-medium text-white tracking-tight">
            Protect the muscle you have worked for.
          </h2>
          <p className="text-[#BFC1C0] mt-5 text-lg max-w-xl mx-auto leading-relaxed">
            Your GLP-1 medication is helping you lose weight. MuscleGuard is designed to
            help you make sure it is the right kind of weight.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 mt-10 px-10 py-3.5 bg-[#CDFF00] text-[#131413] font-medium rounded-lg hover:bg-[#b8e600] transition-colors"
          >
            Start your free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[#585A59] text-sm mt-4">
            7-day free trial · $14.99/mo after · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-[#131413]" />
                <span className="font-semibold text-[#131413]">MuscleGuard</span>
              </div>
              <p className="text-sm text-[#585A59] max-w-xs">
                A wellness tool designed to support GLP-1 medication users in
                preserving lean muscle during weight loss.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[#585A59]">
              <Link href="/legal/terms" className="hover:text-[#131413] transition-colors">
                Terms of Use
              </Link>
              <Link href="/legal/privacy" className="hover:text-[#131413] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/cookies" className="hover:text-[#131413] transition-colors">
                Cookie Policy
              </Link>
              <Link href="/legal/refund" className="hover:text-[#131413] transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-black/5">
            <p className="text-xs text-[#BFC1C0] leading-relaxed">
              <span className="font-semibold text-[#585A59]">Medical Disclaimer:</span>{" "}
              MuscleGuard is not a medical device and is not intended to diagnose, treat, cure,
              or prevent any disease. The information provided by MuscleGuard is for educational
              and informational purposes only and is not a substitute for professional medical
              advice. Always consult your healthcare provider before making changes to your
              diet, exercise routine, or medication regimen. Individual results may vary.
              Testimonials reflect individual experiences and are not guaranteed outcomes.
            </p>
            <p className="text-xs text-[#BFC1C0] mt-4">
              &copy; {new Date().getFullYear()} MuscleGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
