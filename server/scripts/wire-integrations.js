import fs from 'fs';

const filePath = 'C:/Users/PARVEJ ALAM/Desktop/love aabledownload/src/routes/app/integrations.tsx';

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  content = content.replace(
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";'
  );

  content = content.replace(
    'import { demoIntegrations } from "@/lib/demo-data";',
    'import { DataStore } from "@/lib/data-store";'
  );

  // Replace state and toggleConnect
  const oldCode = `export function ConnectedIntegrationsPage() {
  const [integrations, setIntegrations] = useState(demoIntegrations);

  const toggleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = !item.connected;
        toast.info(\`Integration “\${item.name}” \${next ? "connected" : "disconnected"}\`);
        return { ...item, connected: next };
      }),
    );
  };`;

  const newCode = `export function ConnectedIntegrationsPage() {
  const [integrations, setIntegrations] = useState(() => DataStore.getIntegrations());

  useEffect(() => {
    DataStore.syncWithBackend().then(() => {
      setIntegrations(DataStore.getIntegrations());
    });
  }, []);

  const toggleConnect = (id: string) => {
    const updated = DataStore.toggleIntegration(id);
    if (updated) {
      setIntegrations(DataStore.getIntegrations());
      toast.info(\`Integration “\${updated.name}” \${updated.connected ? "connected" : "disconnected"}\`);
    }
  };`;

  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ ConnectedIntegrationsPage is now fully dynamic from backend DataStore!');
}
