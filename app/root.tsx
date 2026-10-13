import "@fontsource-variable/fraunces";
import "@fontsource-variable/public-sans";
import "./app.css";

import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Footer, Header } from "~/components/layout";
import { InquiryDrawer, InquiryProvider } from "~/components/inquiry";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href={assetUrl("/favicon.svg")} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <InquiryProvider>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <InquiryDrawer />
    </InquiryProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const notFound =
    (isRouteErrorResponse(error) && error.status === 404) || (error instanceof Response && error.status === 404);
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-4xl">{notFound ? t("error.notFound") : t("error.generic")}</h1>
      {notFound && <p className="mt-3 text-ink-soft">{t("error.notFoundBody")}</p>}
      <Link to="/" className="mt-6 inline-block font-semibold text-forest underline">
        {t("nav.home")}
      </Link>
    </main>
  );
}
