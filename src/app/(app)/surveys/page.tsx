import { mockSurvey, mockFrames } from "@/lib/mock-data";

export default function SurveysPage() {
  const survey = mockSurvey;
  const flaggedFrames = mockFrames.filter((f) => f.flaggedForReview);
  const overriddenFrames = mockFrames.filter((f) => f.humanOverride);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload dashcam video and track processing progress
          </p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          + New Survey
        </button>
      </div>

      {/* Survey Card */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {survey.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{survey.description}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            {survey.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat label="Frames Processed" value={`${survey.processedFrames} / ${survey.totalFrames}`} />
          <MiniStat label="Segments" value={survey.totalSegments} />
          <MiniStat label="Avg PCI" value={survey.averagePci ?? "—"} />
          <MiniStat label="API Cost" value={`$${survey.processingCost.toFixed(2)}`} />
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Processing Progress</span>
            <span>
              {Math.round(
                (survey.processedFrames / Math.max(survey.totalFrames, 1)) * 100
              )}
              %
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${(survey.processedFrames / Math.max(survey.totalFrames, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Field Verification Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Field Verification
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Frames flagged for human review or already overridden
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Flagged for Review
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-900">
              {flaggedFrames.length}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              frames need inspector verification
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              Human Overrides
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {overriddenFrames.length}
            </p>
            <p className="mt-1 text-xs text-blue-600">
              frames have been manually corrected
            </p>
          </div>
        </div>
      </div>

      {/* Flagged Frames List */}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Frame #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Distress Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                AI PCI
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {flaggedFrames.slice(0, 15).map((frame) => (
              <tr key={frame.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-900">
                  #{frame.frameIndex}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-gray-700">
                  {frame.distressType.replace(/_/g, " ")}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {frame.pciScore}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {(frame.confidence * 100).toFixed(0)}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {frame.humanOverride ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      Overridden
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      Pending Review
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
