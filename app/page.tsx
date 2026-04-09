import Link from "next/link";
import { Shield, Dumbbell, Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-600" />
          <span className="font-bold text-gray-900">MuscleGuard</span>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <Shield className="h-3.5 w-3.5" /> Built for GLP-1 users
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          Lose fat on Ozempic.<br />
          <span className="text-brand-600">Keep your muscle.</span>
        </h1>
        <p className="text-xl text-gray-500 mt-6 max-w-xl mx-auto">
          GLP-1 medications suppress your appetite — but eating too little protein destroys
          the muscle you've built. MuscleGuard coaches you to eat the right amount,
          every single day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/login">
            <Button size="lg" className="px-8">
              Start free 7-day trial
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-3">$14.99/month after trial · Cancel anytime</p>
      </section>

      {/* Pain point */}
      <section className="bg-red-50 border-y border-red-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 text-lg">
                &ldquo;I lost 40 lbs on Ozempic but my doctor said I&apos;ve lost significant muscle mass.
                I look demacrada. Nobody told me about protein.&rdquo;
              </p>
              <p className="text-sm text-red-600 mt-2">— Reddit r/Ozempic (viral thread)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Everything you need to protect your muscle
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border bg-white space-y-3">
            <Dumbbell className="h-7 w-7 text-brand-600" />
            <h3 className="font-semibold text-gray-900 text-lg">Daily protein tracker</h3>
            <p className="text-gray-500">
              One number. &ldquo;You need 32g more protein today.&rdquo; No calorie counting.
              No MyFitnessPal overwhelm. Just protein.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white space-y-3">
            <Sparkles className="h-7 w-7 text-brand-600" />
            <h3 className="font-semibold text-gray-900 text-lg">AI meal generator</h3>
            <p className="text-gray-500">
              Small 200-300g portions, ≥25g protein each. Designed for your suppressed appetite.
              Respects your dietary preferences.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white space-y-3">
            <TrendingUp className="h-7 w-7 text-brand-600" />
            <h3 className="font-semibold text-gray-900 text-lg">Muscle loss alerts</h3>
            <p className="text-gray-500">
              Log your weight and body composition weekly. Get alerted before muscle loss
              becomes a problem — with a corrective plan.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white space-y-3">
            <Shield className="h-7 w-7 text-brand-600" />
            <h3 className="font-semibold text-gray-900 text-lg">20-min strength plan</h3>
            <p className="text-gray-500">
              3 resistance workouts per week. Not to build muscle — to send the signal to keep it.
              No gym required.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            vs. everything else
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-medium text-gray-500">App</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">GLP-1 aware</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Protein focus</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Meal gen</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { name: "MuscleGuard", glp1: true, protein: true, meals: true, price: "$15/mo" },
                  { name: "Shotsy", glp1: true, protein: false, meals: false, price: "Free" },
                  { name: "MeAgain", glp1: true, protein: false, meals: false, price: "Free+" },
                  { name: "Noom Med", glp1: false, protein: false, meals: false, price: "$279/mo" },
                  { name: "MyFitnessPal", glp1: false, protein: false, meals: false, price: "$20/mo" },
                ].map((row) => (
                  <tr key={row.name} className={row.name === "MuscleGuard" ? "bg-brand-50" : ""}>
                    <td className={`py-3 pr-4 font-medium ${row.name === "MuscleGuard" ? "text-brand-800" : "text-gray-700"}`}>
                      {row.name}
                    </td>
                    {[row.glp1, row.protein, row.meals].map((val, i) => (
                      <td key={i} className="text-center py-3 px-2">
                        {val ? (
                          <CheckCircle2 className="h-4 w-4 text-brand-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="text-center py-3 px-2 text-gray-600">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Protect the muscle you&apos;ve worked for.
        </h2>
        <p className="text-gray-500 mt-4">
          Start your free 7-day trial. No credit card required.
        </p>
        <Link href="/login" className="block mt-6">
          <Button size="lg" className="px-10">Get started free</Button>
        </Link>
        <p className="text-sm text-gray-400 mt-3">$14.99/month after trial</p>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        <p>MuscleGuard is not a medical provider. Always consult your doctor about GLP-1 use.</p>
        <p className="mt-1">© 2026 MuscleGuard</p>
      </footer>
    </div>
  );
}
