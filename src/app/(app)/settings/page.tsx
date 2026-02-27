export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your organization, team, and billing
      </p>

      <div className="mt-8 max-w-2xl space-y-8">
        {/* Organization */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
          <div className="mt-4 space-y-4">
            <Field label="Organization Name" value="City of Austin — Public Works" />
            <Field label="Slug" value="city-of-austin" />
            <Field label="Plan" value="Professional" badge />
          </div>
        </section>

        {/* Team Members */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
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
                {[
                  { name: "Antoine D.", email: "antoine@example.com", role: "Admin" },
                  { name: "Maria G.", email: "maria@example.com", role: "Manager" },
                  { name: "James P.", email: "james@example.com", role: "Inspector" },
                ].map((member) => (
                  <tr key={member.email}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {member.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
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
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Professional Plan
                </p>
                <p className="text-xs text-gray-500">
                  Unlimited surveys · Up to 10 users · GIS export · API access
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                $499<span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Manage Subscription
              </button>
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                View Invoices
              </button>
            </div>
          </div>
        </section>

        {/* API Keys */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Integrations & API
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Mapbox</p>
                <p className="text-xs text-gray-500">Connected</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Stripe</p>
                <p className="text-xs text-gray-500">Connected</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  OpenAI (GPT-4o)
                </p>
                <p className="text-xs text-gray-500">API Key configured</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>
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
