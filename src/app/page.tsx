import { AegisNav } from '@/components/aegis/nav';
import { AegisHero } from '@/components/aegis/hero';
import { PerspectiveGrid } from '@/components/aegis/perspective-grid';
import { AegisPlayground } from '@/components/aegis/playground';
import { AegisStreamingDemo } from '@/components/aegis/streaming-demo';
import { AegisAuditExplorer } from '@/components/aegis/audit-explorer';
import { AegisPolicyEditor } from '@/components/aegis/policy-editor';
import { AegisArchitecture } from '@/components/aegis/architecture';
import { AegisSiteFooter } from '@/components/aegis/site-footer';

export default function Home() {
  return (
    <>
      <a href="#playground" className="aegis-skip-link">
        Skip to playground
      </a>
      <AegisNav />
      <main className="relative min-h-screen">
        <AegisHero />
        <PerspectiveGrid />
        <AegisPlayground />
        <AegisStreamingDemo />
        <AegisAuditExplorer />
        <AegisPolicyEditor />
        <AegisArchitecture />
      </main>
      <AegisSiteFooter />
    </>
  );
}
