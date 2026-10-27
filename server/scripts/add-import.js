import fs from 'fs';

const loginPath = 'C:/Users/PARVEJ ALAM/Desktop/love aabledownload/src/routes/login.tsx';
if (fs.existsSync(loginPath)) {
  let content = fs.readFileSync(loginPath, 'utf8');
  if (!content.includes('import { apiClient }')) {
    content = 'import { apiClient } from "@/lib/api-client";\n' + content;
    fs.writeFileSync(loginPath, content, 'utf8');
    console.log('✅ Added apiClient import to login.tsx');
  } else {
    console.log('apiClient already imported in login.tsx');
  }
}
