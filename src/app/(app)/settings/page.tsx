import { Suspense } from "react";
import { SettingsView } from "@/components/settings/settings-view";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <SettingsView />
      </Suspense>
    </div>
  );
}
