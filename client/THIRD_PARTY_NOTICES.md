# Third-party notices

The repository's [asset notice](../NOTICE) is the authoritative summary. Keep it, this file, and the relevant folder READMEs together when redistributing the project.

The primitives in `src/components/ui/` are derived from [shadcn/ui](https://github.com/shadcn-ui/ui), created through its registry and adapted for CIRCA. Its [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) is reproduced below. Installed packages and bundled fonts retain their own license files in their distributions.

The desktop shortcut bitmaps in `public/icons/` are the Windows 98 icon set, retrieved from the [Windows 98 Icon Viewer](https://win98icons.alexmeub.com/). They are Microsoft artwork used here as placeholder shell art for a fictional interface; replace or license them before any distribution. See [public/icons/README.md](public/icons/README.md) for the destination mapping.

The supplied wallpaper, `public/Government_agency_emblem_seal_de…_2K_20261014194612.jpg`, has not had its provenance or redistribution rights confirmed. Treat it as excluded from the MIT grant until they are documented. See the root [asset notice](../NOTICE).

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

## Zilla Slab

The public record reader bundles Zilla Slab from `@fontsource/zilla-slab` under
the SIL Open Font License 1.1. The unmodified package license follows; retain it
with builds embedding the font.

```text
Copyright 2017, The Mozilla Foundation ZillaSlab-LightItalic.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-Regular.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-Italic.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-Medium.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-MediumItalic.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-SemiBold.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-SemiBoldItalic.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-Bold.ttf: Copyright 2017, The Mozilla Foundation ZillaSlab-BoldItalic.ttf: Copyright 2017, The Mozilla Foundation

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.

```

## Incident editor dependencies

The source editor uses [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor), distributed under the MIT License. Its package metadata and upstream repository identify that license; retain the upstream license notice when redistributing it. Browser-storage tests use [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB), under Apache-2.0, with its license retained in the installed distribution. No third-party registry characters or image assets are bundled for the editor.
