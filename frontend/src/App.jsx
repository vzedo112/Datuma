import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useAuth,
} from "@clerk/clerk-react";
import { isClerkConfigured, CLERK_PUBLISHABLE_KEY } from "./lib/auth";
import { setTokenGetter } from "./services/api";

import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import AuthSetupNotice from "./pages/AuthSetupNotice";
import AppLayout from "./components/Layout/AppLayout";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";

function Placeholder({ title }) {
  return (
    <div className="max-w-2xl">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
        Coming soon
      </span>
      <h1 className="font-display text-4xl tracking-tight mb-3">{title}</h1>
      <p className="text-muted-foreground">
        This screen isn't built yet — it'll arrive in the next milestone.
      </p>
    </div>
  );
}

function TokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
    return () => setTokenGetter(null);
  }, [getToken]);
  return null;
}

function ProtectedAppLayout() {
  return (
    <>
      <SignedIn>
        <AppLayout />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function Routing() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />
      {isClerkConfigured ? (
        <>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/app" element={<ProtectedAppLayout />}>
            <Route index element={<Upload />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="history" element={<Placeholder title="Upload history" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Route>
        </>
      ) : (
        <>
          <Route path="/sign-in" element={<AuthSetupNotice />} />
          <Route path="/sign-up" element={<AuthSetupNotice />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Upload />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="history" element={<Placeholder title="Upload history" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Route>
        </>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const navigate = useNavigate();
  if (!isClerkConfigured) return <Routing />;
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
    >
      <TokenSync />
      <Routing />
    </ClerkProvider>
  );
}
