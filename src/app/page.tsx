import { AegisNav } from '@/components/aegis/nav';
import { AegisHero } from '@/components/aegis/hero';
import { AegisPlayground } from '@/components/aegis/playground';
import { AegisStreamingDemo } from '@/components/aegis/streaming-demo';
import { AegisAuditExplorer } from '@/components/aegis/audit-explorer';
import { AegisPolicyEditor } from '@/components/aegis/policy-editor';
import { AegisArchitecture } from '@/components/aegis/architecture';
import { AegisSiteFooter } from '@/components/aegis/site-footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <AegisNav />
      <main className="flex-1">
        <AegisHero />
        <AegisPlayground />
        <AegisStreamingDemo />
        <AegisAuditExplorer />
        <AegisPolicyEditor />
        <AegisArchitecture />
      </main>
      <AegisSiteFooter />
    </div>
  );
}
