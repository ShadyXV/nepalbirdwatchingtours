import { getTripReport } from "~/content";
import { SITE_NAME } from "~/lib/site";
import { TripReportScreen } from "~/screens";
import type { Route } from "./+types/trip-report";

export function meta({ params }: Route.MetaArgs) {
  const report = getTripReport(params.slug);
  if (!report) return [{ title: `404 | ${SITE_NAME}` }];
  return [
    { title: `${report.title} | ${SITE_NAME}` },
    { name: "description", content: report.summary },
  ];
}

export default function TripReport({ params }: Route.ComponentProps) {
  const report = getTripReport(params.slug);
  if (!report) throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  return <TripReportScreen report={report} />;
}
