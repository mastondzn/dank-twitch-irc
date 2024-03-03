import { defineConfig } from "vitepress";

import sidebar from "./typedoc/typedoc-sidebar.json";

export default defineConfig({
  lang: "en-US",
  title: "dank-twitch-irc",
  description: "A Twitch IRC client for Node.js",
  srcDir: ".vitepress/typedoc",
  base: process.env.GITHUB_ACTIONS ? "/dank-twitch-irc/" : "/",
  cleanUrls: true,
  themeConfig: {
    sidebar: [
      {
        text: "API Reference",
        link: "./globals",
        items: sidebar
          .map((item) => ({
            ...item,
            items: item.items.map((subItem) => ({
              ...subItem,
              link: subItem.link.replace(/^\/.vitepress\/typedoc/, ""),
            })),
          }))
          .sort((a, b) => a.text.localeCompare(b.text)),
      },
    ],
  },
});
