import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://cdn.simpleicons.org/github',
        namespace: 'https://github.com/farhandigital/github-creation-date',
        match: ['https://github.com/*'],
        grant: ['GM_xmlhttpRequest', 'GM_getValue', 'GM_setValue'],
        connect: ['ungh.cc'],
        license: "Zlib",
        version: '1.1.1',
        author: 'Farhan Digital',
        description: 'Shows the creation date of GitHub repositories on the repository page metadata sidebar.',
        updateURL: 'https://update.greasyfork.org/scripts/573707/github-creation-date.meta.js',
        downloadURL: 'https://update.greasyfork.org/scripts/573707/github-creation-date.user.js',
      },
    }),
  ],
});
