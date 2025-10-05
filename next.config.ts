import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  register: true,
  scope: "/",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
