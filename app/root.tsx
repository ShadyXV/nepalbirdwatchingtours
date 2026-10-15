import "~/design/fonts";
import "./app.css";

import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Footer, Header } from "~/components/layout";
import { Heading } from "~/components/ui";
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
    <main className="mx-auto max-w-3xl px-gutter py-24 text-center sm:px-gutter-lg">
      <Heading level="h1">{notFound ? t("error.notFound") : t("error.generic")}</Heading>
      {notFound && <p className="mt-3 text-fg-muted">{t("error.notFoundBody")}</p>}
      <Link to="/" className="eyebrow mt-6 inline-flex min-h-tap items-center text-accent hover:text-fg">
        {t("nav.home")}
      </Link>
    </main>
  );
}
