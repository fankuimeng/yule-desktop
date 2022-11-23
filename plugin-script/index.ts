import { Plugin } from "vite";
import fs from "node:fs";
import { join } from "node:path";
export default function pluginScript(): Plugin {
  return {
    // 插件名称
    name: "vite:script",

    // 该插件在 plugin-vue 插件之前执行，这样就可以直接解析到原模板文件
    enforce: "pre",
    // 代码转译，这个函数的功能类似于 `webpack` 的 `loader`
    transform(code, id, opt) {},
    transformIndexHtml(html) {
      const version = fs
        .readFileSync(join(__dirname, "../package.json"), "utf-8")
        .split(",")[1]
        .split(":")[1];

      html = html.replace(
        `<div id="app">`,
        `
        <input type="hidden" id="version" value=${version} ></input>
        <div id="app">
        `,
      );
      let reg = /type=\"module\"/gi;
      return html.replace(reg, "defer='defer'").replace(/crossorigin/gi, "");
    },
  };
}
