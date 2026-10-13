import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid a light-theme flash when dark is preferred. */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var root=document.documentElement;root.classList.toggle('dark',d);root.dataset.theme=d?'dark':'light';root.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
