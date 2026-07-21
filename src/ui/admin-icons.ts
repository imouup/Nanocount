import {
  faArrowRight,
  faArrowRightFromBracket,
  faArrowUpRightFromSquare,
  faChartLine,
  faChartSimple,
  faChevronLeft,
  faChevronRight,
  faCode,
  faCopy,
  faEye,
  faEyeSlash,
  faFileCircleQuestion,
  faFileLines,
  faGlobe,
  faLock,
  faMoon,
  faPen,
  faRotateRight,
  faShieldHalved,
  faSun,
  faXmark,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

const icons = {
  arrowRight: faArrowRight,
  chart: faChartSimple,
  close: faXmark,
  code: faCode,
  copy: faCopy,
  domains: faGlobe,
  edit: faPen,
  empty: faFileCircleQuestion,
  external: faArrowUpRightFromSquare,
  eye: faEye,
  eyeSlash: faEyeSlash,
  lock: faLock,
  logout: faArrowRightFromBracket,
  moon: faMoon,
  next: faChevronRight,
  pages: faFileLines,
  previous: faChevronLeft,
  refresh: faRotateRight,
  shield: faShieldHalved,
  sun: faSun,
  views: faChartLine,
} satisfies Record<string, IconDefinition>;

export type AdminIconName = keyof typeof icons;

function paths(icon: IconDefinition): string {
  const data = icon.icon[4];
  return (Array.isArray(data) ? data : [data]).map((path) => `<path d="${path}"></path>`).join("");
}

const faviconScale = 0.56;
const faviconX = (512 - faChartSimple.icon[0] * faviconScale) / 2;
const faviconY = (512 - faChartSimple.icon[1] * faviconScale) / 2;

export const ADMIN_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#c01872"/><g transform="translate(${faviconX} ${faviconY}) scale(${faviconScale})" fill="#fff">${paths(faChartSimple)}</g></svg>`;

export const ADMIN_ICON_SPRITE = `<svg class="icon-sprite" aria-hidden="true" focusable="false">${Object.entries(
  icons,
)
  .map(
    ([name, icon]) =>
      `<symbol id="fa-${name}" viewBox="0 0 ${icon.icon[0]} ${icon.icon[1]}">${paths(icon)}</symbol>`,
  )
  .join("")}</svg>`;

export function adminIcon(name: AdminIconName, className = ""): string {
  const classes = className ? `fa-icon ${className}` : "fa-icon";
  return `<svg class="${classes}" aria-hidden="true" focusable="false"><use href="#fa-${name}"></use></svg>`;
}
