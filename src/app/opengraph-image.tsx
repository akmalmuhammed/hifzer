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
          background:
            "radial-gradient(circle at top left, rgba(10,138,119,0.28), transparent 30%), radial-gradient(circle at top right, rgba(31,54,217,0.24), transparent 32%), linear-gradient(135deg, #08111f 0%, #0b1220 55%, #132033 100%)",
          color: "#f8fafc",
          fontFamily:
            "Inter, Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08), transparent 36%), repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 18px)",
          }}
        />

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
              padding: "12px 20px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                background: "#2dd4bf",
                boxShadow: "0 0 28px rgba(45,212,191,0.7)",
              }}
            />
            Hifzer
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "920px",
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
                    padding: "10px 18px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#cbd5e1",
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
                fontSize: 70,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.06em",
                maxWidth: "980px",
              }}
            >
              Qur&apos;an reading, review, duas, and notes in one place.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.45,
                color: "rgba(248,250,252,0.78)",
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
                color: "rgba(248,250,252,0.52)",
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
                color: "#99f6e4",
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
