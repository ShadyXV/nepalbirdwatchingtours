import type { ElementType } from "react";
import { getPlace, getSpecies } from "~/content";
import type { Landmark, Month, Observation, Species } from "~/content/types";
import { monthName } from "~/lib/format";

/**
 * The site's signature notebook-style caption (STYLE_GUIDE 3b):
 *
 *   HIMALAYAN MONAL                          name, label caps
 *   Lophophorus impejanus                    scientific name, mono italic, muted
 *   Tadapani, Annapurna · 2,630 m · APR 2025 place · altitude · date, small, muted
 *   "male displaying on the ridge, 06:40"    optional field note
 *
 * Give it a `species`, an `observation` (a photo's caption; its first species is resolved
 * automatically), a `landmark` (mountain style: `MACHHAPUCHHRE · 6,993 m`, no scientific line), or a
 * mix: an observation adds place, altitude, date and note to the species or landmark.
 * `compact` shows only the name and scientific name, for chips and lists.
 * Coordinates and conservation codes are never shown.
 */
export type FieldLabelProps = {
  species?: Species;
  observation?: Observation;
  landmark?: Landmark;
  variant?: "full" | "compact";
  /** Rendered element, e.g. "li" or "figcaption". */
  as?: ElementType;
  className?: string;
};

/** "2025-04" -> "APR 2025"; "2025-04-14" -> "14 APR 2025"; anything else is returned as given. */
export function formatFieldDate(date: string): string {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(date);
  if (!match) return date;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return date;
  const label = `${monthName(month as Month)} ${match[1]}`.toUpperCase();
  return match[3] ? `${Number(match[3])} ${label}` : label;
}

export function formatAltitude(meters: number): string {
  return `${meters.toLocaleString("en")} m`;
}

type Resolved = {
  name?: string;
  scientificName?: string;
  /** Altitude shown on the title line (mountains only). */
  titleAltitude?: number;
  details: string[];
  note?: string;
};

function resolve({ species, observation, landmark }: Pick<FieldLabelProps, "species" | "observation" | "landmark">): Resolved {
  const subject = species ?? (observation?.speciesIds?.[0] ? getSpecies(observation.speciesIds[0]) : undefined);
  const mountain = subject ? undefined : (landmark ?? (observation?.landmarkId ? getPlace(observation.landmarkId) : undefined));
  const date = observation?.date ? formatFieldDate(observation.date) : undefined;
  const altitude = observation?.altitudeM !== undefined ? formatAltitude(observation.altitudeM) : undefined;

  if (subject) {
    return {
      name: subject.commonName,
      scientificName: subject.scientificName,
      details: [observation?.place, altitude, date].filter(isText),
      note: observation?.note,
    };
  }

  if (mountain) {
    // Title carries the elevation; the muted line carries the range (or the photo's place) and date.
    return {
      name: mountain.name,
      titleAltitude: observation?.altitudeM ?? mountain.elevationM,
      details: [observation?.place ?? mountain.range, date].filter(isText),
      note: observation?.note,
    };
  }

  // A plain observation: the place is the title.
  return {
    name: observation?.place,
    details: [altitude, date].filter(isText),
    note: observation?.note,
  };
}

const isText = (value: string | undefined): value is string => Boolean(value);

export function FieldLabel({ variant = "full", as, className = "", ...subject }: FieldLabelProps) {
  const Tag = as ?? "div";
  const { name, scientificName, titleAltitude, details, note } = resolve(subject);
  if (!name && details.length === 0 && !note) return null;

  const full = variant === "full";
  return (
    <Tag className={`font-mono ${className}`}>
      {name && (
        <p className="eyebrow text-fg">
          {name}
          {titleAltitude !== undefined && ` · ${formatAltitude(titleAltitude)}`}
        </p>
      )}
      {scientificName && <p className="text-small italic text-fg-muted">{scientificName}</p>}
      {full && details.length > 0 && <p className="mt-0.5 text-small text-fg-muted">{details.join(" · ")}</p>}
      {full && note && <p className="mt-0.5 text-small text-fg">&ldquo;{note}&rdquo;</p>}
    </Tag>
  );
}
