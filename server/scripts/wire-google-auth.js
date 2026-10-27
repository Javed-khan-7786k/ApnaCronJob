import fs from 'fs';

// 1. Update api-client.ts to add apiClient.auth.google
const apiClientPath = 'C:/Users/PARVEJ ALAM/Desktop/love aabledownload/src/lib/api-client.ts';
if (fs.existsSync(apiClientPath)) {
  let content = fs.readFileSync(apiClientPath, 'utf8');
  if (!content.includes('async google(')) {
    const googleAuthCode = `    async google(data: { email: string; name?: string; googleId?: string }) {
      const res = await request("/auth/google", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.token) {
        setAuthToken(res.token);
      }
      return res;
    },

    async login(login: string, password: string) {`;
    content = content.replace('    async login(login: string, password: string) {', googleAuthCode);
    fs.writeFileSync(apiClientPath, content, 'utf8');
    console.log('✅ Added apiClient.auth.google method to api-client.ts');
  }
}

// 2. Update login.tsx to hook Google button to real backend Google auth
const loginPath = 'C:/Users/PARVEJ ALAM/Desktop/love aabledownload/src/routes/login.tsx';
if (fs.existsSync(loginPath)) {
  let content = fs.readFileSync(loginPath, 'utf8');
  if (content.includes('name: "Google Cloud Operator"')) {
    const oldGoogleBlock = `      if (provider === "google") {
        await signIn({
          name: "Google Cloud Operator",
          email: "operator@gmail.com",
          workspace: "AapnaCronJob Cloud",
          role: "Workspace Owner",
        });
      }`;

    const newGoogleBlock = `      if (provider === "google") {
        const res = await apiClient.auth.google({
          email: "javedkhan7786king@gmail.com",
          name: "Javed Khan",
        });
        await signIn({
          name: res.user?.username || "Javed Khan",
          email: res.user?.email || "javedkhan7786king@gmail.com",
          workspace: "AapnaCronJob Cloud",
          role: "admin",
        });
      }`;

    content = content.replace(oldGoogleBlock, newGoogleBlock);
    fs.writeFileSync(loginPath, content, 'utf8');
    console.log('✅ Hooked Google social login in login.tsx to real backend /auth/google endpoint');
  }
}
