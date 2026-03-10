import { FrameReview } from "@/components/surveys/frame-review";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-8">
      <FrameReview surveyId={id} />
    </div>
  );
}
