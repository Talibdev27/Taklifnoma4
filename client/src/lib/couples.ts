/**
 * Helpers for "twin" / double-wedding mode — two couples (e.g. twin siblings)
 * celebrating at the same time & venue. When `isTwinWedding` is on and a second
 * couple's names are filled in, every template shows both couples side by side.
 *
 * Only the couple names differ between the two weddings; date, time, venue,
 * photos and music are shared.
 */
import type { Wedding } from "@shared/schema";

type CoupleFields = Pick<Wedding, "groom" | "bride" | "isTwinWedding" | "groom2" | "bride2">;

export interface Couple {
  groom: string;
  bride: string;
}

/**
 * True when the wedding is a twin/double wedding AND a second couple has been
 * named. A dangling `isTwinWedding` flag with no second-couple names behaves
 * like an ordinary single wedding.
 */
export function isTwinWedding(w: Partial<CoupleFields> | null | undefined): boolean {
  return !!w?.isTwinWedding && !!(w.groom2?.trim() || w.bride2?.trim());
}

/** The couple(s) for a wedding: one entry normally, two in twin mode. */
export function getCouples(w: CoupleFields): Couple[] {
  const couples: Couple[] = [{ groom: w.groom, bride: w.bride }];
  if (isTwinWedding(w)) {
    couples.push({ groom: w.groom2 || "", bride: w.bride2 || "" });
  }
  return couples;
}

/**
 * Flat "Groom & Bride" string, joined by `join` when there are two couples.
 * For plain-string sinks (social-share `coupleName`, carousel captions, etc.).
 */
export function coupleNames(
  w: CoupleFields,
  { amp = "&", join = " · ", brideFirst = false }: { amp?: string; join?: string; brideFirst?: boolean } = {},
): string {
  return getCouples(w)
    .map((c) => (brideFirst ? `${c.bride} ${amp} ${c.groom}` : `${c.groom} ${amp} ${c.bride}`))
    .join(join);
}

/**
 * Params for the `welcome.weddingTitle` i18n string ("{{bride}} va {{groom}} …").
 * In twin mode each placeholder carries a whole couple so the title reads
 * "CoupleA va CoupleB …". Preserves the existing groom-first ordering templates
 * pass today.
 */
export function weddingTitleParams(w: CoupleFields): { bride: string; groom: string } {
  const couples = getCouples(w);
  if (couples.length > 1) {
    return {
      bride: `${couples[0].groom} & ${couples[0].bride}`,
      groom: `${couples[1].groom} & ${couples[1].bride}`,
    };
  }
  return { bride: w.groom, groom: w.bride };
}
