import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#1d1d1f",
          color: "#f5f5f7",
          fontFamily:
            "Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: "14px",
              color: "#f5f5f7",
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                background: "#4fd1bd",
              }}
            />
            Hifzer
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "1000px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {["Qur'an reading", "Review", "Duas", "Private notes"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 20px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.1)",
                    color: "#d2d2d7",
                    fontSize: 24,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 68,
                lineHeight: 1.06,
                fontWeight: 600,
                letterSpacing: "-0.035em",
                maxWidth: "980px",
              }}
            >
              Qur&apos;an reading, review, duas, and notes in one place.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.4,
                color: "#a1a1a6",
                maxWidth: "860px",
              }}
            >
              Keep your place, keep review visible, and keep private notes close.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "#86868b",
              }}
            >
              hifzer.com
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: 24,
                color: "#4fd1bd",
                fontWeight: 600,
              }}
            >
              Start free
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
