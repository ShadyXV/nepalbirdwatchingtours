import { useEffect, useState, type CSSProperties } from "react";
import { TerrainBackdrop } from "~/components/ui";

// Dev-only (registered in routes.ts only when import.meta.env.DEV): inspect the contour texture.
export function meta() {
  return [{ title: "Terrain texture (lab)" }, { name: "robots", content: "noindex" }];
}

export default function TerrainLab() {
  const [tokens, setTokens] = useState("");
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setTokens(["--texture-opacity", "--texture-size"].map((name) => `${name}: ${style.getPropertyValue(name).trim()}`).join("\n"));
  }, []);

  return (
    <div className="relative min-h-svh p-6">
      <TerrainBackdrop />
      <div className="relative space-y-6">
        <pre className="text-small">{`scripts/textures/contours.mjs -> public/textures/contours.svg\n${tokens}`}</pre>
        <div className="flex flex-wrap gap-4">
          {[0.15, 0.25, 0.4].map((opacity) => (
            <figure key={opacity} className="relative h-64 w-64 border border-border" style={{ "--texture-opacity": opacity } as CSSProperties}>
              <TerrainBackdrop />
              <figcaption className="relative p-2 text-small">{opacity}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
