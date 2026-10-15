import { FieldLabel, SectionTitle } from "~/components/ui";
import { getSpecies } from "~/content";
import type { Species, SpeciesGroup } from "~/content/types";
import { t } from "~/i18n";

const GROUP_ORDER: SpeciesGroup[] = ["bird", "mammal", "reptile", "amphibian", "butterfly", "plant"];

/**
 * The checklist of what was seen, grouped (birds, mammals, butterflies, plants…), each species as
 * its common name and italic scientific name. Unknown ids are skipped.
 */
export function SpeciesChecklist({ speciesIds }: { speciesIds: Species["id"][] }) {
  const seen = [...new Set(speciesIds)].flatMap((id) => getSpecies(id) ?? []);
  const groups = GROUP_ORDER.map((group) => ({ group, species: seen.filter((s) => s.group === group) })).filter(
    (g) => g.species.length > 0,
  );
  if (groups.length === 0) return null;

  return (
    <div className="space-y-14">
      {groups.map(({ group, species }) => (
        <section key={group} aria-labelledby={`seen-${group}`}>
          <SectionTitle as="h3" size="md" id={`seen-${group}`}>
            {t(`group.${group}`)} <span className="text-fg-muted">{species.length}</span>
          </SectionTitle>
          <ul className="mt-6 gap-x-10 sm:columns-2 lg:columns-3">
            {species.map((s) => (
              <FieldLabel key={s.id} as="li" species={s} variant="compact" className="break-inside-avoid pb-5" />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
