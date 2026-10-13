import { SiteChrome } from "@/components/site-chrome";
import { BrainDumpWorkspace } from "@/features/tasks/components/brain-dump-workspace";

export default function Home() {
  return (
    <main className="mt-app-shell flex flex-1 flex-col">
      <SiteChrome>
        <BrainDumpWorkspace />
      </SiteChrome>
    </main>
  );
}
