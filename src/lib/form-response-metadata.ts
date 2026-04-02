import { IntakeFormResponse } from "@/lib/forms";

function firstHeaderValue(request: Request, keys: string[]) {
  for (const key of keys) {
    const value = request.headers.get(key);

    if (value?.trim()) {
      return value.trim();
    }
  }

  return "";
}

function extractIpAddress(request: Request) {
  const forwardedFor = firstHeaderValue(request, [
    "x-forwarded-for",
    "cf-connecting-ip",
    "x-real-ip",
  ]);

  if (!forwardedFor) {
    return "";
  }

  return forwardedFor.split(",")[0]?.trim() ?? "";
}

function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\/|opera/i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent)) return "Safari";
  if (/msie|trident/i.test(userAgent)) return "Internet Explorer";
  return "";
}

function detectOperatingSystem(userAgent: string, platformHint: string) {
  const source = `${userAgent} ${platformHint}`.toLowerCase();

  if (source.includes("android")) return "Android";
  if (source.includes("iphone") || source.includes("ipad") || source.includes("ios")) return "iOS";
  if (source.includes("windows")) return "Windows";
  if (source.includes("mac os") || source.includes("macintosh") || source.includes("macos")) return "macOS";
  if (source.includes("linux")) return "Linux";
  return "";
}

function detectDeviceType(userAgent: string, mobileHint: string) {
  const source = userAgent.toLowerCase();

  if (mobileHint === "?1" || /mobile|iphone|android/i.test(source)) {
    return "Mobile";
  }

  if (/ipad|tablet/i.test(source)) {
    return "Tablet";
  }

  return "Desktop";
}

export function buildFormResponseMetadata(
  request: Request,
): IntakeFormResponse["metadata"] {
  const userAgent = firstHeaderValue(request, ["user-agent"]);
  const country =
    firstHeaderValue(request, ["x-vercel-ip-country", "cf-ipcountry", "x-country"]) || "";
  const region =
    firstHeaderValue(request, ["x-vercel-ip-country-region", "x-region"]) || "";
  const city = firstHeaderValue(request, ["x-vercel-ip-city", "x-city"]) || "";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const browser = detectBrowser(userAgent);
  const operatingSystem = detectOperatingSystem(
    userAgent,
    firstHeaderValue(request, ["sec-ch-ua-platform"]),
  );
  const deviceType = detectDeviceType(
    userAgent,
    firstHeaderValue(request, ["sec-ch-ua-mobile"]),
  );
  const submittedFrom = [city, region, country].filter(Boolean).join(", ");

  return {
    ipAddress: extractIpAddress(request),
    userAgent: userAgent || "",
    browser,
    operatingSystem,
    deviceType,
    country,
    region,
    city,
    timezone,
    submittedFrom,
  };
}
