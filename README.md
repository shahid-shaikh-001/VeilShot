# 🛡️ VeilShot — Privacy-First Screenshot Editor

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-Black?style=for-the-badge\&logo=next.js)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge\&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge\&logo=tailwindcss)
![Privacy](https://img.shields.io/badge/Processing-100%25_Local-16A34A?style=for-the-badge)

### Protect sensitive information before sharing screenshots.

VeilShot is a privacy-first screenshot editor that allows users to blur, pixelate, and permanently redact sensitive information directly inside the browser.

All image processing happens locally on the user's device. Images are never uploaded to a backend server or stored in a cloud database.

[GitHub Repository](https://github.com/shahid-shaikh-001/VeilShot) 

</div>

---

## ✨ Features

### 🔒 Privacy Protection Tools

* Blur sensitive information
* Pixelate selected areas
* Apply permanent solid redaction
* Create multiple privacy regions
* Move and resize selected regions
* Delete individual privacy regions
* Adjust blur strength and pixelation size

### 🖼️ Screenshot Editing

* Upload PNG, JPG, JPEG, and WebP images
* Drag-and-drop image upload
* Interactive screenshot editing canvas
* Zoom in and zoom out
* Fit image to workspace
* Select and modify existing regions
* Compare original and protected screenshots

### ↩️ Editing Controls

* Undo previous actions
* Redo reverted actions
* Delete selected regions
* Reset the editor
* Keyboard shortcuts for faster editing
* Responsive editing workspace

### 📤 Export Options

* Export screenshots in PNG format
* Export screenshots in JPG format
* Control JPG image quality
* Preserve the original image resolution
* Copy protected images to the clipboard
* Download the final edited screenshot

### 🛡️ Privacy-First Architecture

* No backend image processing
* No image upload API
* No cloud storage
* No database
* No user account required
* No paid image-processing API
* No permanent screenshot storage

---

## 🔐 Privacy Model

VeilShot processes screenshots entirely inside the browser.

During an editing session, the application temporarily stores:

* The selected image file
* A temporary browser object URL
* Decoded image pixels
* Privacy-region coordinates
* Editing history
* The generated export image

The temporary data is removed when the user replaces the image, resets the editor, closes the page, or ends the browser session.

> For highly sensitive information, permanent solid redaction is recommended. Blur and pixelation can sometimes preserve contextual visual information.

---

## 🛠️ Technology Stack

### Frontend

* Next.js
* React.js
* TypeScript
* Tailwind CSS

### Image Editing

* React Konva
* Konva.js
* Browser Canvas API
* File API
* Blob API
* Object URL API
* Clipboard API

### UI and Utilities

* Lucide React
* Sonner
* Custom React Hooks
* Context API

### Development Tools

* ESLint
* Prettier
* TypeScript Compiler
* npm

---

## 🏗️ System Architecture

```text
User Browser
│
├── Next.js Application
│
├── Screenshot Upload Layer
│   ├── File Validation
│   ├── File API
│   └── Object URL Generation
│
├── Screenshot Editor
│   ├── React Konva Canvas
│   ├── Image Rendering
│   ├── Privacy Regions
│   ├── Region Selection
│   └── Resize and Move Controls
│
├── Editor State
│   ├── Active Tool
│   ├── Selected Region
│   ├── Undo History
│   ├── Redo History
│   └── Zoom State
│
└── Export Pipeline
    ├── Offscreen Canvas
    ├── Full-Resolution Rendering
    ├── PNG/JPG Generation
    ├── Clipboard Copy
    └── File Download
```

VeilShot separates interactive editing from final image export.

The visible React Konva canvas handles user interaction, selection, movement, resizing, and previewing. A separate offscreen browser canvas renders the final protected screenshot at the original image resolution.

---

## 🔄 How It Works

1. The user uploads or drags a screenshot into the application.
2. VeilShot validates the file type, size, and image dimensions.
3. The browser decodes and displays the image locally.
4. The user selects blur, pixelation, or redaction.
5. The user draws a privacy region over sensitive information.
6. The region can be moved, resized, modified, or deleted.
7. Every change is stored in the editing history.
8. The preview feature displays the protected output.
9. An offscreen canvas renders the final image at full resolution.
10. The user downloads or copies the protected screenshot.

---

## 📁 Supported Image Formats

| Requirement         | Supported Value      |
| ------------------- | -------------------- |
| Image formats       | PNG, JPG, JPEG, WebP |
| Processing location | User's browser       |
| Server upload       | Not required         |
| Database storage    | Not used             |
| Export formats      | PNG and JPG          |

SVG and animated GIF files are not supported in the current version.

---

## ⌨️ Keyboard Shortcuts

| Action                 | Shortcut                |
| ---------------------- | ----------------------- |
| Select tool            | `V`                     |
| Blur tool              | `B`                     |
| Pixelate tool          | `P`                     |
| Redact tool            | `R`                     |
| Undo                   | `Ctrl/Cmd + Z`          |
| Redo                   | `Ctrl/Cmd + Shift + Z`  |
| Delete selected region | `Delete` or `Backspace` |
| Deselect region        | `Escape`                |
| Fit image              | `0`                     |
| Zoom in                | `+`                     |
| Zoom out               | `-`                     |

---

## 📂 Project Structure

```text
VeilShot/
│
├── public/
│   ├── screenshots/
│   └── assets/
│
├── src/
│   ├── app/
│   │   ├── about/
│   │   ├── editor/
│   │   ├── privacy/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── editor/
│   │       ├── AnnotationLayer.tsx
│   │       ├── EditorCanvas.tsx
│   │       ├── EditorSidebar.tsx
│   │       ├── EditorToolbar.tsx
│   │       ├── ExportDialog.tsx
│   │       ├── ImageUploader.tsx
│   │       ├── PreviewDialog.tsx
│   │       └── PrivacyScanDialog.tsx
│   │
│   ├── features/
│   │   ├── export/
│   │   └── image-processing/
│   │
│   ├── hooks/
│   │   └── useEditorShortcuts.ts
│   │
│   ├── lib/
│   │
│   ├── providers/
│   │   └── EditorProvider.tsx
│   │
│   └── types/
│       └── editor.ts
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🚀 Installation and Setup

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/shahid-shaikh-001/VeilShot.git
cd VeilShot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

Open the application:

```text
http://localhost:3000
```

The current version does not require environment variables because image processing happens entirely inside the browser.

---

## ✅ Development Commands

Start the development server:

```bash
npm run dev
```

Run ESLint:

```bash
npm run lint
```

Run TypeScript validation:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Format the codebase:

```bash
npm run format
```

---

## ☁️ Deployment

VeilShot can be deployed directly using Vercel.

### Deployment Steps

1. Push the source code to GitHub.
2. Sign in to Vercel.
3. Import the VeilShot repository.
4. Select Next.js as the framework.
5. Keep the default build configuration.
6. Deploy the application.

Because VeilShot does not require a backend, database, or private API keys, the deployment process is lightweight.

---

## 📸 Screenshots

Create this folder inside the project:

```text
public/screenshots/
```

Add screenshots using names such as:

```text
public/screenshots/home.png
public/screenshots/editor.png
public/screenshots/blur-tool.png
public/screenshots/preview.png
public/screenshots/export.png
```

Then display them in the README:

### Home Page

<img src="./public/screenshots/home.png" alt="VeilShot Home Page" width="100%" />

### Screenshot Editor

<img src="./public/screenshots/editor.png" alt="VeilShot Screenshot Editor" width="100%" />

### Privacy Protection Tools

<img src="./public/screenshots/blur-tool.png" alt="VeilShot Privacy Protection Tools" width="100%" />

### Protected Image Preview

<img src="./public/screenshots/preview.png" alt="VeilShot Protected Image Preview" width="100%" />

### Export Options

<img src="./public/screenshots/export.png" alt="VeilShot Export Options" width="100%" />

---

## 📈 Project Highlights

* Privacy-first screenshot editing
* Completely browser-based image processing
* Blur, pixelation, and permanent redaction tools
* Multiple editable privacy regions
* Undo and redo history management
* Original-resolution image export
* PNG and JPG export support
* Clipboard image copying
* Responsive editing interface
* No backend or database dependency
* No user authentication requirement
* No cloud image storage
* Production-oriented Next.js architecture

---

## 🎯 Use Cases

VeilShot can be used to protect sensitive information in:

* Application screenshots
* Email screenshots
* Payment screenshots
* Account dashboards
* Personal conversations
* API keys and tokens
* Phone numbers
* Email addresses
* Usernames
* Internal company information
* Medical or financial screenshots
* Bug reports and technical documentation

---

## 🗺️ Future Improvements

* Automatic text detection
* Automatic face detection
* AI-assisted privacy scanning
* Batch screenshot processing
* Reusable redaction presets
* Additional redaction styles
* Local project persistence
* Progressive Web App support
* Offline editing
* Additional export formats
* Accessibility improvements
* Automated testing coverage
* Browser extension support

---

## 👨‍💻 Author

### Shahid Shaikh

* GitHub: [shahid-shaikh-001](https://github.com/shahid-shaikh-001)
* Repository: [VeilShot](https://github.com/shahid-shaikh-001/VeilShot)
* Live Server: [VeilShot](https://veil-shot.vercel.app/)
* Email: [shahidshaikhofficial.7@gmail.com](mailto:shahidshaikhofficial.7@gmail.com)

---

## ⭐ Support

If you found VeilShot useful, consider giving the repository a star.

---

## 📜 License

This project is currently maintained as a portfolio and technical-assignment project.

Add a formal open-source license before allowing external redistribution or commercial reuse.
