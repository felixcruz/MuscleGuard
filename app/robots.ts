import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/meals",
          "/training",
          "/medication",
          "/progress",
          "/reports",
          "/settings",
          "/onboarding",
        ],
      },
    ],
    sitemap: "https://muscle-guard.vercel.app/sitemap.xml",
  };
}
