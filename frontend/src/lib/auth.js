const RAW_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

export const CLERK_PUBLISHABLE_KEY = RAW_KEY;

export const isClerkConfigured = Boolean(
  RAW_KEY && RAW_KEY !== "your_clerk_key" && RAW_KEY.startsWith("pk_")
);
