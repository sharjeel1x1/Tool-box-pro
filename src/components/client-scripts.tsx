'use client';

import Script from 'next/script';

export default function ClientScripts() {
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8159344073070790"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
