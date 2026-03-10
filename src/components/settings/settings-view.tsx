"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import { PLANS, type PlanKey } from "@/lib/stripe";

interface SettingsData {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: PlanKey;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  };
  teamMembers: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  }[];
  currentUser: {
    id: string;
    role: string;
  };
}

export function SettingsView() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") {
      setBillingMessage("Subscription activated successfully!");
    } else if (billing === "cancelled") {
      setBillingMessage("Checkout was cancelled.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleCheckout = async (plan: PlanKey) => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setBillingMessage(result.error || "Failed to start checkout");
      }
    } catch {
      setBillingMessage("Failed to start checkout");
    } finally {
      setBillingLoading(false);
    }
  };

  const handlePortal = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        setBillingMessage(result.error || "Failed to open billing portal");
      }
    } catch {
      setBillingMessage("Failed to open billing portal");
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-gray-400">
        Failed to load settings
      </div>
    );
  }

  const isAdmin = data.currentUser.role === "admin";
  const currentPlan = PLANS[data.organization.plan] ?? PLANS.starter;
  const hasSubscription = !!data.organization.stripeSubscriptionId;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your organization, team, and billing
      </p>

      {/* Billing notification */}
      {billingMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
          <Check className="h-4 w-4 text-blue-500" />
          <p className="text-sm text-blue-700">{billingMessage}</p>
          <button
            onClick={() => setBillingMessage(null)}
            className="ml-auto text-xs text-blue-500 hover:text-blue-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-8 max-w-3xl space-y-8">
        {/* Organization */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
          <div className="mt-4 space-y-4">
            <Field label="Organization Name" value={data.organization.name} />
            <Field label="Slug" value={data.organization.slug} />
            <Field label="Plan" value={currentPlan.name} badge />
          </div>
        </section>

        {/* Team Members */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members ({data.teamMembers.length})
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {[member.firstName, member.lastName]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-800">
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Billing */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Billing</h2>

          {/* Current plan */}
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {currentPlan.name} Plan
                </p>
                <p className="text-xs text-gray-500">
                  {currentPlan.features.join(" · ")}
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {currentPlan.price !== null ? (
                  <>
                    ${currentPlan.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/yr</span>
                  </>
                ) : (
                  "Custom"
                )}
              </p>
            </div>

            {isAdmin && (
              <div className="mt-4 flex gap-3">
                {hasSubscription ? (
                  <button
                    onClick={handlePortal}
                    disabled={billingLoading}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {billingLoading && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage Subscription
                  </button>
                ) : (
                  <p className="text-xs text-gray-400">
                    Select a plan below to get started
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Plan cards */}
          {isAdmin && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
                ([key, plan]) => {
                  const isCurrent = key === data.organization.plan;
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-5 ${
                        isCurrent
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <h3 className="text-sm font-semibold text-gray-900">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {plan.price !== null ? (
                          <>
                            ${plan.price.toLocaleString()}
                            <span className="text-sm font-normal text-gray-500">
                              /yr
                            </span>
                          </>
                        ) : (
                          "Custom"
                        )}
                      </p>
                      <ul className="mt-3 space-y-1">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-1.5 text-xs text-gray-600"
                          >
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <div className="mt-4 rounded-lg bg-blue-100 px-3 py-2 text-center text-xs font-semibold text-blue-700">
                          Current Plan
                        </div>
                      ) : plan.price === null ? (
                        <a
                          href="mailto:sales@groundtruth.ai"
                          className="mt-4 block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Contact Sales
                        </a>
                      ) : (
                        <button
                          onClick={() => handleCheckout(key)}
                          disabled={billingLoading}
                          className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {billingLoading ? "Loading..." : `Upgrade to ${plan.name}`}
                        </button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}

          {!isAdmin && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700">
                Only organization admins can manage billing.
              </p>
            </div>
          )}
        </section>

        {/* Integrations */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Integrations & API
          </h2>
          <div className="mt-4 space-y-3">
            <IntegrationStatus
              name="Mapbox"
              configured={!!process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            />
            <IntegrationStatus
              name="OpenAI (GPT-4o)"
              configured={true}
              description="API Key configured"
            />
            <IntegrationStatus
              name="Stripe"
              configured={hasSubscription}
              description={
                hasSubscription ? "Subscription active" : "No active subscription"
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      {badge ? (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800">
          {value}
        </span>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      )}
    </div>
  );
}

function IntegrationStatus({
  name,
  configured,
  description,
}: {
  name: string;
  configured: boolean;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">
          {description ?? (configured ? "Connected" : "Not configured")}
        </p>
      </div>
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          configured ? "bg-green-500" : "bg-gray-300"
        }`}
      />
    </div>
  );
}
