import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// El preset de nitro se detecta solo según la plataforma de despliegue (Netlify, etc.).
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({ server: { entry: "server" } }),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});
