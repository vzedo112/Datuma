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
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import AuthSetupNotice from "./pages/AuthSetupNotice";
import AppLayout from "./components/Layout/AppLayout";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import SharedDashboard from "./pages/SharedDashboard";
import Sample from "./pages/Sample";

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
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />
      <Route path="/help" element={<Help />} />
      <Route path="/faq" element={<Help />} />
      <Route path="/share/:token" element={<SharedDashboard />} />
      <Route path="/sample" element={<Sample />} />
      {isClerkConfigured ? (
        <>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/app" element={<ProtectedAppLayout />}>
            <Route index element={<Upload />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/:id" element={<Dashboard />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </>
      ) : (
        <>
          <Route path="/sign-in" element={<AuthSetupNotice />} />
          <Route path="/sign-up" element={<AuthSetupNotice />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Upload />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/:id" element={<Dashboard />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
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
