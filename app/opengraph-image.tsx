import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#131413",
          padding: "90px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 8,
            backgroundColor: "#CDFF00",
            borderRadius: 4,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-4px",
            lineHeight: 1,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 42,
            color: "rgba(255,255,255,0.72)",
            marginTop: 28,
            maxWidth: 900,
            lineHeight: 1.25,
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    { ...size }
  );
}
