import fs from 'fs';

// 1. Update auth.tsx to parse ?token= from URL params on load
const authPath = 'C:/Users/PARVEJ ALAM/Desktop/love aabledownload/src/lib/auth.tsx';
if (fs.existsSync(authPath)) {
  let content = fs.readFileSync(authPath, 'utf8');

  // Update default user email to javedkhan7786king@gmail.com
  content = content.replace(
    'email: "admin@apnascheduler.local",',
    'email: "javedkhan7786king@gmail.com",\n  name: "Javed Khan",'
  );

  if (!content.includes('urlParams.get("token")')) {
    const searchParamCode = `      // Handle Google OAuth redirect callback token in URL query
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get("token");
        if (urlToken) {
          setAuthToken(urlToken);
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {}
        }
      }

      let localUser: User | null = null;`;

    content = content.replace('      let localUser: User | null = null;', searchParamCode);
    fs.writeFileSync(authPath, content, 'utf8');
    console.log('✅ Updated auth.tsx with URL token param parser');
  }
}

// 2. Update login.tsx so clicking Google button initiates standard OAuth redirect to /api/auth/google
const loginPath = 'C:/Users/PARVEJ ALAM/Desktop/love aabledownload/src/routes/login.tsx';
if (fs.existsSync(loginPath)) {
  let content = fs.readFileSync(loginPath, 'utf8');
  if (content.includes('handleSocialSignIn = async (provider: "google" | "github") => {')) {
    const oldBlock = `  const handleSocialSignIn = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    const providerName = provider === "google" ? "Google" : "GitHub";
    toast.loading(\`Connecting to \${providerName}...\`, { id: "social-auth" });

    try {`;

    const newBlock = `  const handleSocialSignIn = async (provider: "google" | "github") => {
    if (provider === "google") {
      toast.loading("Redirecting to Google OAuth...", { id: "social-auth" });
      window.location.href = "http://localhost:5000/api/auth/google";
      return;
    }

    setSocialLoading(provider);
    const providerName = "GitHub";
    toast.loading(\`Connecting to \${providerName}...\`, { id: "social-auth" });

    try {`;

    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(loginPath, content, 'utf8');
    console.log('✅ Updated login.tsx Google button to redirect to http://localhost:5000/api/auth/google');
  }
}
