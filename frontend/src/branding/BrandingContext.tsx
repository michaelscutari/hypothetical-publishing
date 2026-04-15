import * as React from 'react';

/** Branding info served by `/api/config/branding`. */
export interface Branding {
  publisherName: string;
  publisherShortName: string;
  logoUrl: string;
}

/** Defaults used before the API response arrives and if the request fails. */
const DEFAULT_BRANDING: Branding = {
  publisherName: 'Hypothetical Publishing',
  publisherShortName: 'HP',
  logoUrl: '/branding/logo.svg',
};

const BrandingContext = React.createContext<Branding>(DEFAULT_BRANDING);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = React.useState<Branding>(DEFAULT_BRANDING);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/config/branding');
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Branding>;
        if (cancelled) return;
        setBranding({
          publisherName: data.publisherName || DEFAULT_BRANDING.publisherName,
          publisherShortName: data.publisherShortName || DEFAULT_BRANDING.publisherShortName,
          logoUrl: data.logoUrl || DEFAULT_BRANDING.logoUrl,
        });
      } catch {
        // Keep defaults on network error — degraded branding is better than blocking render.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reflect publisher name in the browser tab title.
  React.useEffect(() => {
    document.title = branding.publisherName;
  }, [branding.publisherName]);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranding(): Branding {
  return React.useContext(BrandingContext);
}
