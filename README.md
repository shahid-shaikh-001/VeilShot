# VeilShot

**VeilShot** is a privacy-first screenshot cleaner for blurring, pixelating, and permanently redacting sensitive information before sharing an image.

All image processing happens locally in the browser. VeilShot does not upload screenshots to an application server, store images in a database, or require an account.

## Features

- PNG, JPG, and WebP upload with drag-and-drop support
- Strict file-size, format, and image-dimension validation
- Blur, pixelation, and solid redaction tools
- Multiple editable privacy regions
- Select, move, resize, restyle, and delete individual regions
- Adjustable blur strength and pixel size
- Undo and redo history
- Keyboard shortcuts
- Zoom and fit-to-workspace controls
- Original-versus-protected preview
- Full-resolution PNG and JPG export
- JPEG quality control
- Copy protected output to the clipboard
- Responsive editor layout
- Local-only processing with no backend or paid API

## Technology

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- React Konva and Konva.js
- Browser Canvas, File, Blob, Object URL, and Clipboard APIs
- Sonner notifications
- Lucide icons

## Architecture

```text
Browser
├── Next.js application shell
├── Editor state and history
├── React Konva interaction layer
│   ├── Base image
│   ├── Privacy regions
│   └── Selection transformer
├── Full-resolution Canvas export pipeline
└── Browser APIs
    ├── File API
    ├── Object URL API
    ├── Canvas API
    ├── Blob API
    └── Clipboard API
```

The visible Konva canvas is used for interaction. Exporting uses a separate offscreen canvas at the original image dimensions, so the downloaded output does not depend on the browser viewport or current zoom level.

## Privacy model

VeilShot does not include:

- Image-upload API routes
- Server-side image processing
- Cloud image storage
- User accounts
- A database
- Image-content analytics
- Paid AI or OCR APIs

While editing, the browser temporarily holds the selected file, an object URL, decoded pixels, annotation coordinates, and an export Blob. Object URLs are revoked when the image is removed, replaced, or the editor unmounts.

Solid redaction is the recommended mode for highly sensitive data. Blur and pixelation can preserve contextual clues, so users should inspect the final preview before sharing.

## Supported files

| Requirement        |               Limit |
| ------------------ | ------------------: |
| Formats            | PNG, JPG/JPEG, WebP |
| Maximum file size  |               15 MB |
| Maximum dimensions |  12,000 × 12,000 px |

SVG and animated GIF files are intentionally excluded from the current release.

## Keyboard shortcuts

| Action                 | Shortcut                                 |
| ---------------------- | ---------------------------------------- |
| Select                 | `V`                                      |
| Blur                   | `B`                                      |
| Pixelate               | `P`                                      |
| Redact                 | `R`                                      |
| Undo                   | `Ctrl/Cmd + Z`                           |
| Redo                   | `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` |
| Delete selected region | `Delete` / `Backspace`                   |
| Deselect               | `Escape`                                 |
| Fit image              | `0`                                      |
| Zoom in                | `+`                                      |
| Zoom out               | `-`                                      |

## Local development

### Requirements

- Node.js 20 or newer
- npm

### Installation

```bash
npm install
```

### Start development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run format:check
```

## Project structure

```text
src/
├── app/
│   ├── about/
│   ├── editor/
│   ├── privacy/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/editor/
│   ├── AnnotationLayer.tsx
│   ├── EditorCanvas.tsx
│   ├── EditorSidebar.tsx
│   ├── EditorToolbar.tsx
│   ├── ExportDialog.tsx
│   ├── ImageUploader.tsx
│   └── PreviewDialog.tsx
├── features/
│   ├── export/export-image.ts
│   └── image-processing/validate-image.ts
├── hooks/useEditorShortcuts.ts
├── lib/
├── providers/EditorProvider.tsx
└── types/editor.ts
```

## Deployment

VeilShot is designed for the Vercel Hobby plan.

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Keep the default Next.js framework settings.
4. Deploy without private environment variables.

The application is statically rendered except for the browser-only interactive editor.

## Assignment requirement

The website includes a button labelled exactly **Built for Digital Heroes**, linked to `https://digitalheroesco.com`, along with the developer's visible name and contact email.

## Author

**Shahid Shaikh**  
`shahidsocials.007@gmail.com`

## License

This project is currently provided as a portfolio and technical-assignment project. Add a formal license before wider redistribution.
# VeilShot
