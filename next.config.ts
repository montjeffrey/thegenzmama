import type { NextConfig } from "next";

// Security headers are set here rather than in netlify.toml: Netlify applies
// [[headers]] to static files only, while these also cover server-rendered
// routes such as /studio and the server actions behind /contact.

// Enforced on every route. X-Frame-Options stops other sites framing the pages
// (including /studio and /contact).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

// Report-Only: violations show in the browser console but nothing is blocked, so
// this cannot break the site or the Studio. Review the console on a deploy preview
// (contact form, map, /studio), tighten, then rename the header to
// Content-Security-Policy. frame-ancestors is left out because browsers ignore it
// in Report-Only mode; X-Frame-Options above enforces it.
//
// Third parties the code loads: Cloudflare Turnstile (script + iframe), Google
// Maps JS API (script, tiles, fonts), Sanity CDN images. 'unsafe-inline' is for
// Next's inline bootstrap scripts and styled-components/Tailwind styles.
const siteCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://*.googleapis.com https://*.gstatic.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://maps.googleapis.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// The embedded Sanity Studio needs eval, its own APIs and realtime sockets.
const studioCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https://*.sanity.io wss://*.sanity.io https://*.sanity-cdn.com",
  "frame-src 'self' https://*.sanity.io",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/:path((?!studio(?:/|$)).*)",
        headers: [{ key: "Content-Security-Policy-Report-Only", value: siteCsp }],
      },
      {
        source: "/studio/:path*",
        headers: [{ key: "Content-Security-Policy-Report-Only", value: studioCsp }],
      },
    ];
  },
};

export default nextConfig;
