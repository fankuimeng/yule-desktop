import { build, defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import pluginScript from "./plugin-script/index";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default (opt) => {
  const { mode } = opt;
  const production = loadEnv(mode, process.cwd()).VITE_MAIN;

  const defineConfig = {
    base: "./",
    plugins: [
      vue(),
      production === "production" && pluginScript(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),

      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    server: {
      host: "0.0.0.0",
      port: 9000,
      https: false,
      hmr: true,
    },
    resolve: {
      alias: {
        "@": resolve("src"),
      },
    },
  };
  return defineConfig;
};
