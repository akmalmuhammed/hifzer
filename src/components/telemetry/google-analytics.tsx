import Script from "next/script";

const fallbackMeasurementId = "G-C145MM3CEX";
const measurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || fallbackMeasurementId;

export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production" || !measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
