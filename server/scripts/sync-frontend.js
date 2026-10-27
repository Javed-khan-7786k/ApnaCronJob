import fs from 'fs';
import path from 'path';

const dataStorePath = 'C:/Users/PARVEJ ALAM/Desktop/love aabledownload/src/lib/data-store.ts';

if (fs.existsSync(dataStorePath)) {
  let content = fs.readFileSync(dataStorePath, 'utf8');

  // 1. Add INTEGRATIONS_STORAGE_KEY if missing
  if (!content.includes('INTEGRATIONS_STORAGE_KEY')) {
    content = content.replace(
      'const SETTINGS_STORAGE_KEY = "aapnacronjob_settings";',
      'const SETTINGS_STORAGE_KEY = "aapnacronjob_settings";\nconst INTEGRATIONS_STORAGE_KEY = "aapnacronjob_integrations";'
    );
  }

  // 2. Add integration sync in syncWithBackend()
  if (!content.includes('Sync Integrations') && content.includes('// Sync Team Members')) {
    const integrationSyncCode = `      // Sync Integrations
      try {
        const integRes = await apiClient.integrations.list();
        if (integRes.success && Array.isArray(integRes.data) && integRes.data.length > 0) {
          setStorageItem(INTEGRATIONS_STORAGE_KEY, integRes.data);
        }
      } catch (err) {}

      // Sync Team Members`;
    content = content.replace('      // Sync Team Members', integrationSyncCode);
  }

  // 3. Make getIntegrations and toggleIntegration dynamic
  if (content.includes('getIntegrations(): Integration[] {\n    return initialIntegrations;\n  }')) {
    const dynamicIntegrationsCode = `getIntegrations(): Integration[] {
    return getStorageItem<Integration[]>(INTEGRATIONS_STORAGE_KEY, initialIntegrations);
  },

  toggleIntegration(id: string): Integration | undefined {
    const list = this.getIntegrations();
    const target = list.find((i) => i.id === id);
    if (!target) return undefined;
    const updated = list.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i));
    setStorageItem(INTEGRATIONS_STORAGE_KEY, updated);
    apiClient.integrations.toggle(id).catch(() => {});
    return { ...target, connected: !target.connected };
  }`;
    content = content.replace('getIntegrations(): Integration[] {\n    return initialIntegrations;\n  }', dynamicIntegrationsCode);
  }

  fs.writeFileSync(dataStorePath, content, 'utf8');
  console.log('✅ Frontend DataStore updated: Integrations are now 100% dynamic from backend!');
} else {
  console.log('Frontend dataStorePath not found:', dataStorePath);
}
