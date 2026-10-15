# Third-party notices

The primitives in `src/components/ui/` are derived from [shadcn/ui](https://github.com/shadcn-ui/ui), generated through its registry and adapted for CIRCA. Its [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) is reproduced below. Installed packages and bundled fonts retain their own license files in their distributions.

The desktop shortcut bitmaps in `public/icons/` are the Windows 98 icon set, retrieved from the [Windows 98 Icon Viewer](https://win98icons.alexmeub.com/). They are Microsoft artwork used here as placeholder shell art for a fictional interface; replace or license them before any distribution. See [public/icons/README.md](public/icons/README.md) for the destination mapping.

The record Markdown renderer in `src/lib/markdown/` and `src/components/reader/` builds on [react-markdown](https://github.com/remarkjs/react-markdown), [remark](https://github.com/remarkjs/remark) (`remark-parse`, `remark-gfm`, `remark-frontmatter`), [mdast-util-to-hast](https://github.com/syntax-tree/mdast-util-to-hast), [unist-util-visit](https://github.com/syntax-tree/unist-util-visit), and [vfile](https://github.com/vfile/vfile), all MIT-licensed, and on [yaml](https://github.com/eemeli/yaml), which is ISC-licensed. Their license files are retained in their distributions.

`public/Ghost_story.md` is authored preview content for the fictional archive, carried into `src/components/reader/ghost-story.ts` as a bundled string because a browser cannot read it from disk. A test holds the two copies identical.

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
