import Link from "next/link";
import {
  Construction,
  Video,
  Brain,
  BarChart3,
  FileText,
  MapPin,
  Shield,
  Zap,
  Check,
  ArrowRight,
  Accessibility,
} from "lucide-react";

const FEATURES = [
  {
    icon: Video,
    title: "Dashcam Upload",
    description:
      "Upload dashcam video from any vehicle. We extract frames automatically at 1fps using FFmpeg.",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "GPT-4o Vision detects 10 distress types — potholes, cracking, rutting, and more — with confidence scores.",
  },
  {
    icon: BarChart3,
    title: "PCI Scoring",
    description:
      "Automated Pavement Condition Index (0-100) for every road segment, following ASTM D6433 methodology.",
  },
  {
    icon: MapPin,
    title: "Interactive Map",
    description:
      "Color-coded Mapbox visualization of all road segments. Click any segment for detailed analysis.",
  },
  {
    icon: FileText,
    title: "Export Reports",
    description:
      "Generate council-ready PDF, PPTX, Shapefile (GIS), and CSV reports with one click.",
  },
  {
    icon: Accessibility,
    title: "ADA Compliance",
    description:
      "Automatic flagging of ADA curb ramp issues. District-level equity analysis built in.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: 3000,
    description: "Small towns under 10K population",
    features: [
      "Up to 50 road miles",
      "2 surveys per year",
      "PDF & CSV export",
      "Email support",
    ],
  },
  {
    name: "Standard",
    price: 8000,
    description: "Municipalities with 10K–50K population",
    features: [
      "Up to 200 road miles",
      "4 surveys per year",
      "All export formats",
      "GIS integration",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Professional",
    price: 18000,
    description: "Cities with 50K–100K population",
    features: [
      "Up to 500 road miles",
      "Unlimited surveys",
      "All export formats",
      "GIS integration",
      "Dedicated account manager",
    ],
  },
  {
    name: "Enterprise",
    price: null,
    description: "Large cities and counties (500+ miles)",
    features: [
      "Unlimited road miles",
      "Unlimited surveys",
      "Custom AI training",
      "On-premise option",
      "Dedicated account manager",
      "SLA guarantee",
    ],
  },
];

const STEPS = [
  {
    step: "1",
    title: "Upload Video",
    description: "Mount a dashcam and drive your roads. Upload the video to GroundTruth AI.",
  },
  {
    step: "2",
    title: "AI Analyzes",
    description: "Our AI extracts frames, detects distress types, and scores every segment.",
  },
  {
    step: "3",
    title: "Review & Report",
    description: "Review results on the interactive map, apply human overrides, and export reports.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Construction className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">
              GroundTruth AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            AI-Powered Pavement Assessment
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900">
            Dashcam to PCI scores{" "}
            <span className="text-blue-600">in minutes</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            GroundTruth AI converts dashcam video into Pavement Condition Index
            scores, distress maps, and council-ready reports. Built for Texas
            municipalities.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8 rounded-2xl border border-gray-200 bg-gray-50 px-8 py-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">10+</p>
            <p className="mt-1 text-sm text-gray-500">Distress types detected</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">0-100</p>
            <p className="mt-1 text-sm text-gray-500">PCI scoring range</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">4</p>
            <p className="mt-1 text-sm text-gray-500">Export formats</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Three simple steps from dashcam footage to actionable reports
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div
                key={step}
                className="relative rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              A complete road inspection platform — from video upload to
              council-ready reports
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key differentiators */}
      <section className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Built for Municipal Public Works
              </h2>
              <p className="mt-4 text-gray-600">
                Unlike generic inspection tools, GroundTruth AI is purpose-built
                for Texas municipalities with features designed by public works
                engineers.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Field verification workflow — AI + human review for accuracy",
                  "ADA curb ramp compliance flagging on every segment",
                  "District-level equity analysis for fair budget allocation",
                  "Full audit trail — every AI decision is logged and traceable",
                  "Data export guarantee — your data is always yours, no lock-in",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <Shield className="h-8 w-8 text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  SOC 2 Ready
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Enterprise-grade security and compliance
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <Zap className="h-8 w-8 text-amber-500" />
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  10x Faster
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Compared to manual windshield surveys
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  ASTM D6433
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PCI methodology compliance
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <MapPin className="h-8 w-8 text-red-500" />
                <p className="mt-3 text-sm font-semibold text-gray-900">
                  GIS Export
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Shapefile for ArcGIS and QGIS
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Start free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Annual contracts aligned with municipal budget cycles
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular
                    ? "border-blue-500 shadow-xl shadow-blue-600/10"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                {plan.price !== null ? (
                  <p className="mt-4 text-4xl font-bold text-gray-900">
                    ${plan.price.toLocaleString()}
                    <span className="text-base font-normal text-gray-500">
                      /yr
                    </span>
                  </p>
                ) : (
                  <p className="mt-4 text-4xl font-bold text-gray-900">
                    Custom
                  </p>
                )}
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price !== null ? "/sign-up" : "/contact"}
                  className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {plan.price !== null ? "Get Started" : "Contact Sales"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-[#1a365d] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to modernize your road inspections?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-200">
            Join municipalities across Texas using AI to maintain their roads
            more efficiently, equitably, and transparently.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#1a365d] shadow-lg hover:bg-gray-100"
          >
            Start Your Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">
              GroundTruth AI
            </span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} GroundTruth AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
