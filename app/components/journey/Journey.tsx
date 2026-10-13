import "./journey.css";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useInquiry } from "~/components/inquiry";
import type { JourneyFootprint, MapApi } from "~/components/map/types";
import type { Landmark, MediaAsset, Trip } from "~/content/types";
import { t } from "~/i18n";
import { DAY_LAYOUT, MAP_LAYOUT } from "~/lib/mapLayout";
import { SEEN_FROM, tripBirdTotal, tripDays } from "~/lib/tripDays";
import { DayBar, DayTop } from "./DayControls";
import { DaySheet } from "./DaySheet";
import { layoutDay, type DayLayout } from "./dayLayout";
import { DayStory, Diary, WholeWay } from "./DayStage";
import { MediaSlot } from "./FeatheredMedia";
import { Swap } from "./motion";
import { attachStepInput } from "./stepInput";
import { DAY_PARAM, parseDayParam, useJourneyUrl } from "./useJourneyUrl";

/**
 * The trip's DAY VIEW ("the journey", docs/JOURNEY.md): a full-screen, focused mode over the map,
 * entered from the overview ("Start the journey", "Day n →", a `?day=n` link) and left with
 * Overview, ✕, Esc or Back, which return to the overview exactly as it was (scroll and camera).
 *
 * It is a client-side enhancement of the trip page, whose prerendered HTML already holds every day
 * (TripScreen's day-by-day list). This component owns the mode: the URL (`useJourneyUrl`), the
 * document state (`html[data-journey]`: stage full-screen, overview inert, no page scroll), the
 * input (stepInput: one day per gesture, never a midpoint), the map (MapApi journey: camera, mood,
 * today's stretch, midpoint taps), and the day's composition (media slots, story, diary, controls,
 * the This-day sheet, the final "whole way" card).
 *
 * html[data-journey] goes "entering" → "open" → "leaving" (the camera returns) → "settling" (the
 * stage fades) → removed. journey.css keys everything to it.
 */

type Phase = "closed" | "open" | "leaving";

/** Stage fade when the day view hands the screen back to the overview, ms (journey.css). */
const SETTLE_MS = 260;
const SEEN_FROM_MAX = SEEN_FROM.max;

/**
 * Text block widths for the layout pass (dayLayout.ts; the photos' sizes are its MEDIA constants):
 * share of the screen width, capped (px). Their heights are measured. Space kept around the day's
 * route and markers (`pad`) and between items (`gap`), and the one-line diary's height, px.
 */
const DAY_SIZES = {
  desktop: { head: [0.34, 480], diary: [0.3, 380] },
  phone: { head: [0.9, 360], diary: [0.9, 360] },
  pad: 24,
  gap: 16,
  diaryCompactH: 44,
} as const;

function sizesFor(wide: boolean, w: number) {
  const s = wide ? DAY_SIZES.desktop : DAY_SIZES.phone;
  return { head: Math.min(w * s.head[0], s.head[1]), diary: Math.min(w * s.diary[0], s.diary[1]) };
}

const OVERVIEW_SELECTORS = ["body > header", "body > footer", "#story", ".nbt-stage__stepper"];

function setDocState(state: string | null): void {
  const html = document.documentElement;
  if (state) html.dataset.journey = state;
  else delete html.dataset.journey;
}

/** The overview (header, story sheet, footer, stepper) is inert while the day view is open. */
function setOverviewInert(on: boolean): void {
  const seen = new Set<Element>();
  for (const selector of OVERVIEW_SELECTORS) {
    document.querySelectorAll(selector).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type JourneyProps = {
  trip: Trip;
  map: MapApi | null;
  /** The map has loaded and shows this trip (its engine can take the day view). */
  mapReady: boolean;
};

export function Journey({ trip, map, mapReady }: JourneyProps) {
  const [params] = useSearchParams();
  const urlDay = parseDayParam(trip, params.get(DAY_PARAM));
  const nav = useJourneyUrl(trip);
  const { openInquiry } = useInquiry();
  const days = tripDays(trip);
  const total = days.length;

  const [phase, setPhase] = useState<Phase>("closed");
  const [shownDay, setShownDay] = useState(urlDay ?? 1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [sheet, setSheet] = useState(false);
  const [stopId, setStopId] = useState<string | null>(null);
  const [intro, setIntro] = useState(false);
  /** Landed on ?day=n: the first day is simply there (no entrance choreography). */
  const [landed, setLanded] = useState(false);
  const [wide, setWide] = useState(false);
  const [peaksByDay, setPeaksByDay] = useState<Record<number, Landmark[] | null>>({});
  const [viewport, setViewport] = useState({ w: 1024, h: 768 });
  const [layout, setLayout] = useState<DayLayout | null>(null);
  const [layoutTick, setLayoutTick] = useState(0);
  /** After the first placement: blocks and photos glide to new places (not from 0, 0). */
  const [settled, setSettled] = useState(false);
  const relayout = useCallback(() => setLayoutTick((n) => n + 1), []);
  /** The day's route, markers and labels on screen, measured once the camera rests (null: predicted). */
  const footprint = useRef<JourneyFootprint | null>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const diaryRef = useRef<HTMLDivElement>(null);
  const diaryFullH = useRef(96);

  const layerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRun = useRef(true);
  const direct = useRef(false);
  const savedScroll = useRef(0);
  const mapDay = useRef<number | null>(null);
  const latest = useRef({ shownDay, sheet, stopId, nav, target: shownDay });
  latest.current = { ...latest.current, shownDay, sheet, stopId, nav };

  const day = shownDay <= total ? days[shownDay - 1] : null;

  /* ----------------------------------------------------- open / close */

  const close = useCallback(() => {
    setPhase("leaving");
    setSheet(false);
    setDocState("leaving");
    const finish = () => {
      setDocState("settling");
      window.setTimeout(() => {
        setDocState(null);
        setOverviewInert(false);
        window.scrollTo({ top: savedScroll.current, behavior: "instant" as ScrollBehavior });
        mapDay.current = null;
        setPhase("closed");
      }, reducedMotion() ? 0 : SETTLE_MS);
    };
    if (map && mapDay.current !== null) void map.closeJourney().then(finish);
    else finish();
  }, [map]);

  useEffect(() => {
    const landing = firstRun.current;
    firstRun.current = false;
    if (urlDay !== null && phase === "closed") {
      direct.current = landing;
      footprint.current = null;
      savedScroll.current = window.scrollY;
      latest.current.target = urlDay;
      setShownDay(urlDay);
      setDirection(1);
      setStopId(null);
      setSheet(false);
      setIntro(!landing);
      setLanded(landing);
      setOverviewInert(true);
      setDocState(landing ? "open" : "entering");
      if (!landing) requestAnimationFrame(() => requestAnimationFrame(() => setDocState("open")));
      setPhase("open");
    } else if (urlDay === null && phase === "open") {
      close();
    } else if (urlDay !== null && phase === "open" && urlDay !== shownDay) {
      latest.current.target = urlDay;
      footprint.current = null;
      setDirection(urlDay > shownDay ? 1 : -1);
      setShownDay(urlDay);
      setStopId(null);
      setSheet(false);
      setIntro(false);
      setLanded(false);
    }
  }, [urlDay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving the page (another trip, home) while open: put the document back.
  useEffect(
    () => () => {
      if (document.documentElement.dataset.journey) {
        setDocState(null);
        setOverviewInert(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (phase === "open") headingRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${MAP_LAYOUT.desktopFrom}px)`);
    const sync = () => {
      setWide(query.matches);
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  /* ------------------------------------------------------------ map */

  useEffect(() => {
    if (!map || !mapReady || phase !== "open") return;
    if (mapDay.current === null) void map.openJourney(shownDay, { animate: !direct.current });
    else if (mapDay.current !== shownDay) void map.goToDay(shownDay, { direction });
    mapDay.current = shownDay;
  }, [map, mapReady, phase, shownDay, direction]);

  const chooseStop = useCallback(
    (id: string | null) => {
      const current = latest.current;
      const d = current.shownDay <= total ? days[current.shownDay - 1] : null;
      if (!d) return;
      const next = id && id !== d.anchor.id && id !== current.stopId ? id : null;
      setStopId(next);
      void map?.focusDayStop(next);
    },
    [map, days, total],
  );

  useEffect(() => {
    if (!map || phase !== "open") return;
    map.setJourneyListener({
      stop: (id) => chooseStop(id),
      // The camera came to rest: measure where the day sits on screen and lay out around it.
      frame: () => {
        footprint.current = map.journeyFootprint();
        relayout();
      },
    });
    return () => map.setJourneyListener(null);
  }, [map, phase, chooseStop, relayout]);

  // "Seen from here": refine the day's candidates with a line-of-sight check (once per day).
  useEffect(() => {
    if (!map || !mapReady || phase !== "open" || !day || day.n in peaksByDay) return;
    if (day.curatedPeaks || day.peaks.length === 0) {
      setPeaksByDay((p) => ({ ...p, [day.n]: day.peaks }));
      return;
    }
    let live = true;
    void map.visiblePeaks(day.anchor.coords, day.peakPool).then((seen) => {
      if (!live) return;
      const visible = seen ? day.peakPool.filter((pk) => seen.has(pk.id)).slice(0, SEEN_FROM_MAX) : day.peaks;
      setPeaksByDay((p) => ({ ...p, [day.n]: visible }));
    });
    return () => {
      live = false;
    };
  }, [map, mapReady, phase, day, peaksByDay]);

  /* --------------------------------------------------------- layout */

  const sizes = sizesFor(wide, viewport.w);
  const hasMediaA = Boolean(day ? day.media[0] : trip.cover);
  const hasMediaB = Boolean(day ? day.media[1] : trip.reel.some((m) => m.kind === "image"));

  // Place the headline, media and diary in the free space around the day (dayLayout.ts): before
  // paint on every day change (around the camera's planned clear band), again once the camera
  // rests (around the measured route, markers and labels), on resize, orbit and text changes.
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (phase === "closed" || !layer) return;
    const { w, h } = viewport;
    const top = layer.querySelector(".jr-top")?.getBoundingClientRect().bottom ?? 0;
    const bottom = layer.querySelector(".jr-bar")?.getBoundingClientRect().top ?? h;
    const band = wide ? DAY_LAYOUT.desktop : DAY_LAYOUT.phone;
    const predicted = { x: w * band.left, y: h * band.top, w: w * (1 - band.left - band.right), h: h * (1 - band.top - band.bottom) };
    const measured = footprint.current;
    // The full diary's height is measured only while it shows in full (a one-line diary must not
    // feed back into the choice between the two).
    if (diaryRef.current && !layout?.diaryCompact && diaryRef.current.offsetHeight > 0) diaryFullH.current = diaryRef.current.offsetHeight;
    const controls = document.querySelector(".nbt-map__controls")?.getBoundingClientRect();
    setLayout(
      layoutDay({
        screen: { x: 0, y: top, w, h: Math.max(0, bottom - top) },
        footprint: measured?.rect ?? predicted,
        obstacles: controls && controls.width > 0 ? [{ x: controls.left, y: controls.top, w: controls.width, h: controls.height }] : [],
        anchor: measured?.anchor ?? null,
        viewport: { w, h },
        head: { w: sizes.head, h: storyRef.current?.offsetHeight ?? 160 },
        diary: day ? { w: sizes.diary, h: diaryFullH.current } : null,
        diaryCompact: day ? { w: sizes.diary, h: DAY_SIZES.diaryCompactH } : null,
        media: [hasMediaA, hasMediaB],
        pad: DAY_SIZES.pad,
        gap: DAY_SIZES.gap,
      }),
    );
  }, [phase, shownDay, stopId, layoutTick, wide, viewport, day, hasMediaA, hasMediaB]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "open" || !layout) {
      if (phase === "closed") setSettled(false);
      return;
    }
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, [phase, layout]);

  // Text blocks that change height (fonts arriving, a stop panel) lay out again.
  useEffect(() => {
    if (phase === "closed") return;
    const observer = new ResizeObserver(() => relayout());
    if (storyRef.current) observer.observe(storyRef.current);
    if (diaryRef.current) observer.observe(diaryRef.current);
    return () => observer.disconnect();
  }, [phase, relayout]);

  /* ---------------------------------------------------------- input */

  const stepBy = useCallback(
    (delta: 1 | -1) => {
      const target = latest.current.target + delta;
      if (target < 1 || target > total + 1) {
        // The ends: a short lean, no exit.
        const layer = layerRef.current;
        layer?.style.setProperty("--jr-pull", String(delta * 18));
        window.setTimeout(() => layer?.style.setProperty("--jr-pull", "0"), 180);
        return;
      }
      latest.current.target = target;
      latest.current.nav.step(target);
    },
    [total],
  );

  const exit = useCallback(() => latest.current.nav.exit(), []);

  useEffect(() => {
    if (phase !== "open") return;
    return attachStepInput({
      step: stepBy,
      exit: () => (latest.current.sheet ? setSheet(false) : exit()),
      pull: (px) => layerRef.current?.style.setProperty("--jr-pull", String(Math.round(px))),
      suspended: () => latest.current.sheet,
    });
  }, [phase, stepBy, exit]);

  /* ----------------------------------------------------- composition */

  const media: [MediaAsset | undefined, MediaAsset | undefined] = useMemo(() => {
    if (day) return [day.media[0], day.media[1]];
    const still = trip.reel.find((m) => m.kind === "image");
    return [trip.cover, still && still !== trip.cover ? still : undefined];
  }, [day, trip]);

  const announce = day
    ? t("journey.announce", {
        day: day.n,
        total,
        place: day.anchor.name,
        altitude: day.anchor.altitudeM.toLocaleString("en"),
        birds: day.stats.todayIds.length,
      })
    : t("journey.announceEnd", { birds: tripBirdTotal(trip), days: total });

  if (phase === "closed") return null;

  const peaks = day ? (peaksByDay[day.n] ?? null) : null;

  return (
    <div
      ref={layerRef}
      className="jr"
      data-phase={phase}
      data-direction={direction}
      data-end={day ? undefined : ""}
      data-stop={stopId ? "" : undefined}
      data-landing={landed ? "" : undefined}
      data-intro={intro ? "" : undefined}
      data-sheet={sheet ? "" : undefined}
      data-settled={settled ? "" : undefined}
      role="region"
      aria-roledescription={t("journey.roledescription")}
      aria-label={t("journey.region", { trip: trip.title })}
    >
      <div className="jr-scrim" aria-hidden="true" />

      <MediaSlot slot="a" asset={media[0]} day={shownDay} priority={shownDay === 1} intro={intro} rect={layout?.media[0] ?? null} />
      <MediaSlot slot="b" asset={media[1]} day={shownDay} priority={false} intro={intro} rect={layout?.media[1] ?? null} />

      <div ref={storyRef} className="jr-block jr-story" style={blockStyle(layout?.head ?? null, sizes.head)}>
        <Swap
          k={`story-${shownDay}`}
          value={shownDay}
          render={(n) => {
            const d = n <= total ? days[n - 1] : null;
            return d ? (
              <DayStory day={d} stopId={n === shownDay ? stopId : null} onStop={chooseStop} headingRef={n === shownDay ? headingRef : undefined} />
            ) : (
              <WholeWay birds={tripBirdTotal(trip)} days={total} onPlan={() => openInquiry({ tripSlug: trip.slug })} onOverview={exit} />
            );
          }}
        />
      </div>

      {day && (
        <div ref={diaryRef} className="jr-block jr-diary" style={blockStyle(layout?.diary ?? null, sizes.diary)}>
          <Swap k={`diary-${shownDay}`} value={day} render={(d) => <Diary day={d} compact={Boolean(layout?.diaryCompact)} onMore={() => setSheet(true)} />} />
        </div>
      )}

      <DayTop title={trip.title} day={shownDay} total={total} onExit={exit} />
      <DayBar
        day={shownDay}
        total={total}
        onPrev={() => stepBy(-1)}
        onNext={() => stepBy(1)}
        onThisDay={day ? () => setSheet(true) : null}
        onInquire={() => openInquiry({ tripSlug: trip.slug })}
      />

      {day && <DaySheet trip={trip} day={day} open={sheet} peaks={peaks} onClose={() => setSheet(false)} />}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

/** A text block placed by the layout pass; unplaced blocks stay measurable but invisible. */
function blockStyle(rect: { x: number; y: number; w: number } | null, width: number): React.CSSProperties {
  return rect ? { left: rect.x, top: rect.y, width: rect.w } : { left: 0, top: 0, width, visibility: "hidden" };
}
