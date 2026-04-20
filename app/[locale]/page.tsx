import { Link } from "@/i18n/navigation";
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
import { MuscleChart } from "@/components/landing/MuscleChart";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const features = [
    {
      icon: Dumbbell,
      title: t("feature1Title"),
      description: t("feature1Desc"),
    },
    {
      icon: Sparkles,
      title: t("feature2Title"),
      description: t("feature2Desc"),
    },
    {
      icon: Activity,
      title: t("feature3Title"),
      description: t("feature3Desc"),
    },
    {
      icon: Pill,
      title: t("feature4Title"),
      description: t("feature4Desc"),
    },
    {
      icon: BarChart2,
      title: t("feature5Title"),
      description: t("feature5Desc"),
    },
    {
      icon: TrendingUp,
      title: t("feature6Title"),
      description: t("feature6Desc"),
    },
    {
      icon: MessageSquare,
      title: t("feature7Title"),
      description: t("feature7Desc"),
    },
  ];

  const comparisonRows = [
    {
      name: tc("appName"),
      glp1: true,
      doseProtein: true,
      mealPlanner: true,
      training: true,
      medReminders: true,
      price: "$14.99/mo",
      highlight: true,
    },
    {
      name: t("compGenericCalorie"),
      glp1: false,
      doseProtein: false,
      mealPlanner: false,
      training: false,
      medReminders: false,
      price: "$10–15/mo",
      highlight: false,
    },
    {
      name: t("compGlp1Telehealth"),
      glp1: true,
      doseProtein: false,
      mealPlanner: false,
      training: false,
      medReminders: false,
      price: "$149+/mo",
      highlight: false,
    },
    {
      name: t("compWeightCoaching"),
      glp1: true,
      doseProtein: false,
      mealPlanner: false,
      training: true,
      medReminders: false,
      price: "$99–199/mo",
      highlight: false,
    },
    {
      name: t("compMacroTracker"),
      glp1: false,
      doseProtein: false,
      mealPlanner: false,
      training: false,
      medReminders: false,
      price: "$10–15/mo",
      highlight: false,
    },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  const steps = [
    { step: "1", title: t("step1Title"), description: t("step1Desc") },
    { step: "2", title: t("step2Title"), description: t("step2Desc") },
    { step: "3", title: t("step3Title"), description: t("step3Desc") },
  ];

  const pricingFeatures = [
    t("pricingFeature1"),
    t("pricingFeature2"),
    t("pricingFeature3"),
    t("pricingFeature4"),
    t("pricingFeature5"),
    t("pricingFeature6"),
    t("pricingFeature7"),
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "MuscleGuard",
            applicationCategory: "LifestyleApplication",
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
            <span className="font-semibold text-lg text-[#131413] tracking-tight">{tc("appName")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#131413] border border-black/10 rounded-lg hover:bg-[#f7f7f7] transition-colors"
            >
              {tc("signIn")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-28 text-center">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase mb-8">
            {t("heroSubtitle")}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-[#131413] leading-[1.1] tracking-tight">
            {t("heroTitle1")}<br />
            {t("heroTitle2")} <span className="bg-[#CDFF00] text-[#131413] px-2 py-0.5">{t("heroHighlight")}</span>
          </h1>
          <p className="text-lg text-[#585A59] mt-8 max-w-2xl mx-auto leading-relaxed">
            {t("heroDescription")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-3.5 bg-[#131413] text-white text-base font-medium rounded-lg hover:bg-[#202222] transition-colors"
            >
              {tc("startFreeTrial")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-sm text-[#585A59] mt-4">
            {t("trialInfo")}
          </p>
        </div>
      </section>

      {/* Pain Point */}
      <section className="bg-[#131413]">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div className="flex items-start gap-5">
            <AlertTriangle className="h-7 w-7 text-[#CDFF00] mt-1 shrink-0" />
            <p className="font-medium text-white text-lg leading-relaxed">
              {t("painPoint")}
            </p>
          </div>
          <div className="mt-8 p-5 bg-white/5 rounded-[10px] border border-white/10">
            <p className="text-[#BFC1C0] text-sm leading-relaxed">
              <span className="font-semibold text-[#CDFF00]">{t("researchConfirm")}</span>{" "}
              {t("researchText")}
            </p>
          </div>
        </div>
      </section>

      {/* Animated Chart */}
      <section className="bg-[#131413]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            {t("scienceLabel")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-white text-center mb-4 tracking-tight">
            {t("scienceTitle")}
          </h2>
          <p className="text-white/50 text-center max-w-xl mx-auto mb-12">
            {t("scienceDesc")}
          </p>
          <MuscleChart />
        </div>
      </section>

      {/* The Problem Explained */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            {t("whyMattersLabel")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            {t("whyMattersTitle")}
          </h2>
          <p className="text-[#585A59] text-center max-w-2xl mx-auto mb-16">
            {t("whyMattersDesc")}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[10px] border border-black/5 bg-white space-y-4">
              <div className="h-12 w-12 bg-[#131413] rounded-[10px] flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-[#CDFF00]" />
              </div>
              <h3 className="font-medium text-[#131413] text-lg">{t("problem1Title")}</h3>
              <p className="text-[#585A59] leading-relaxed">
                {t("problem1Desc")}
              </p>
            </div>
            <div className="p-8 rounded-[10px] border border-black/5 bg-white space-y-4">
              <div className="h-12 w-12 bg-[#131413] rounded-[10px] flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#CDFF00]" />
              </div>
              <h3 className="font-medium text-[#131413] text-lg">{t("problem2Title")}</h3>
              <p className="text-[#585A59] leading-relaxed">
                {t("problem2Desc")}
              </p>
            </div>
            <div className="p-8 rounded-[10px] border border-black/5 bg-white space-y-4">
              <div className="h-12 w-12 bg-[#131413] rounded-[10px] flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-[#CDFF00]" />
              </div>
              <h3 className="font-medium text-[#131413] text-lg">{t("problem3Title")}</h3>
              <p className="text-[#585A59] leading-relaxed">
                {t("problem3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f7f7f7]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            {t("featuresLabel")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            {t("featuresTitle")}
          </h2>
          <p className="text-[#585A59] text-center max-w-2xl mx-auto mb-16">
            {t("featuresDesc")}
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
            {t("comparisonLabel")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            {t("comparisonTitle")}
          </h2>
          <p className="text-[#585A59] text-center max-w-2xl mx-auto mb-14">
            {t("comparisonDesc")}
          </p>
          <div className="overflow-x-auto rounded-[10px] border border-black/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f7f7f7] border-b border-black/5">
                  <th className="text-left py-4 px-4 font-medium text-[#585A59]">{t("compApp")}</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">{t("compGlp1")}</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">{t("compDoseProtein")}</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">{t("compMealPlanner")}</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">{t("compTrainingPlan")}</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">{t("compMedReminders")}</th>
                  <th className="text-center py-4 px-3 font-medium text-[#585A59]">{t("compPrice")}</th>
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
                            <span className="text-[#BFC1C0] text-xs">{tc("notAvailable")}</span>
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
            {t("compDisclaimer")}
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#f7f7f7]">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            {t("howItWorksLabel")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-4 tracking-tight">
            {t("howItWorksTitle")}
          </h2>
          <p className="text-[#585A59] text-center max-w-xl mx-auto mb-16">
            {t("howItWorksDesc")}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
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

      {/* Pricing */}
      <section className="bg-[#f7f7f7]">
        <div className="max-w-lg mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            {t("pricingLabel")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-14 tracking-tight">
            {t("pricingTitle")}
          </h2>
          <div className="rounded-[10px] bg-white border border-black/5 overflow-hidden">
            <div className="bg-[#CDFF00] text-[#131413] text-center py-2.5 text-sm font-medium tracking-wide">
              {t("trialBanner")}
            </div>
            <div className="p-8">
              <h3 className="text-lg font-medium text-[#131413]">{t("proPlan")}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-medium text-[#131413]">{t("proPrice")}</span>
                <span className="text-[#585A59]">{t("perMonth")}</span>
              </div>
              <p className="text-sm text-[#BFC1C0] mt-1">{t("afterTrial")}</p>
              <ul className="mt-8 space-y-4">
                {pricingFeatures.map((item) => (
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
                {tc("startFreeTrial")} <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-[#BFC1C0] text-center mt-3">
                {t("cancelFromSettings")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-sm font-medium tracking-widest text-[#585A59] uppercase text-center mb-4">
            {t("faqLabel")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-medium text-[#131413] text-center mb-14 tracking-tight">
            {t("faqTitle")}
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
            {t("ctaTitle")}
          </h2>
          <p className="text-[#BFC1C0] mt-5 text-lg max-w-xl mx-auto leading-relaxed">
            {t("ctaDesc")}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 mt-10 px-10 py-3.5 bg-[#CDFF00] text-[#131413] font-medium rounded-lg hover:bg-[#b8e600] transition-colors"
          >
            {t("ctaButton")} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[#585A59] text-sm mt-4">
            {t("ctaTrialInfo")}
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
                <span className="font-semibold text-[#131413]">{tc("appName")}</span>
              </div>
              <p className="text-sm text-[#585A59] max-w-xs">
                {t("footerDesc")}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[#585A59]">
              <Link href="/legal/terms" className="hover:text-[#131413] transition-colors">
                {t("termsOfUse")}
              </Link>
              <Link href="/legal/privacy" className="hover:text-[#131413] transition-colors">
                {t("privacyPolicy")}
              </Link>
              <Link href="/legal/cookies" className="hover:text-[#131413] transition-colors">
                {t("cookiePolicy")}
              </Link>
              <Link href="/legal/refund" className="hover:text-[#131413] transition-colors">
                {t("refundPolicy")}
              </Link>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-black/5">
            <p className="text-xs text-[#BFC1C0] leading-relaxed">
              <span className="font-semibold text-[#585A59]">{t("medicalDisclaimerLabel")}</span>{" "}
              {t("medicalDisclaimer")}
            </p>
            <p className="text-xs text-[#BFC1C0] mt-4">
              &copy; {new Date().getFullYear()} {t("legalEntity")}. {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
