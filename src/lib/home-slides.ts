/**
 * Orodha ya slaidi za hero. Ukurasa (`page.tsx`) haizingati picha moja kwa
 * moja: unasoma orodha hii, kwa hivyo kuongeza, kupunguza au kupanga upya
 * slaidi ni mabadiliko ya data pekee.
 *
 * Maelezo yote ya lugha (kichwa, maelezo, chanzo cha picha) yuko kwenye
 * `t.home.slides` kwa mpangilio uleule — slaidi ya kwanza ina nambari 0.
 */
export type HomeSlide = {
  id: string;
  /** Picha ya uani; slaidi ya chapa (brand) haina picha. */
  src?: string;
  width?: number;
  height?: number;
  /** Maelezo ya mfupi ya kivinjari kwa picha. */
  altKey?: "photoAria1" | "photoAria2";
  /** Mstari wa chini unaotaja chanzo cha picha, ili usiwe kauli ya uongo. */
  credit?: boolean;
  /** Kitufe kinachopelekana na slaidi. */
  href: string;
  labelKey: "foodCta" | "sokoniCta" | "servicesCta";
};

export const homeSlides: HomeSlide[] = [
  {
    id: "sokoni",
    src: "/iaa/campus-main.png",
    width: 800,
    height: 300,
    altKey: "photoAria1",
    credit: true,
    href: "/market",
    labelKey: "sokoniCta",
  },
  {
    id: "wauzaji",
    src: "/iaa/campus-block.png",
    width: 547,
    height: 280,
    altKey: "photoAria2",
    credit: true,
    href: "/msosi",
    labelKey: "foodCta",
  },
  {
    id: "huduma",
    href: "/services",
    labelKey: "servicesCta",
  },
];
