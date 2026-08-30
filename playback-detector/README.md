# Playback Detector

A lightweight JavaScript-based visual analysis tool for detecting whether video playback is occurring from device screenshots.

The project is designed around a simple automation problem:

> **Given screenshots captured from a playback device, can we determine with reasonable confidence whether video playback is active?**

The detector analyzes visual information from screenshots and produces a playback decision with a confidence score.

The project is intentionally designed so that screenshot acquisition and playback analysis remain independent. This allows the same detection logic to work with screenshots from different devices or automation frameworks.

---

## Overview

In a typical streaming-device automation workflow, knowing that a playback command was sent is not enough to confirm that playback actually started.

For example:

```text
Send PLAY command
       ↓
Wait
       ↓
Take screenshot
       ↓
Analyze screen
       ↓
Determine playback state
```

A device may receive the command successfully while the application is still buffering, displaying an error, showing an advertisement, or remaining on the previous screen.

This project explores using visual evidence from screenshots to make that determination.

---

## Current Architecture

```text
              Screenshot Source
                     │
                     ▼
              screenshot.js
                     │
                     ▼
             detectPlayback()
                     │
          ┌──────────┴──────────┐
          │                     │
     Visual Analysis       Frame Analysis
          │                     │
          └──────────┬──────────┘
                     ▼
              Confidence Score
                     │
                     ▼
              Playback Result
```

The screenshot source is deliberately separated from the detection logic.

This means the detector can eventually receive screenshots from:

* Roku
* Fire TV
* Apple TV
* Android TV
* Test fixtures
* Existing device automation frameworks

without requiring changes to the core playback detection algorithm.

---

## Project Structure

```text
playback-detector/
│
├── src/
│   ├── screenshot.js
│   ├── detectPlayback.js
│   └── index.js
│
├── samples/
│   ├── playing.png
│   ├── paused.png
│   └── buffering.png
│
├── screenshots/
│   └── .gitkeep
│
├── package.json
├── README.md
└── .gitignore
```

### `src/screenshot.js`

Responsible for obtaining or loading a screenshot.

During development, local sample images are used instead of requiring a physical streaming device.

### `src/detectPlayback.js`

Contains the core playback detection logic.

This module is responsible for analyzing the screenshot and producing a playback result.

### `src/index.js`

Application entry point that connects screenshot acquisition with playback detection.

### `samples/`

Contains screenshots used as test inputs during development.

This allows the project to be developed and tested without requiring a physical streaming device.

---

## Detection Strategy

The detector is designed to evolve from basic visual classification toward temporal frame analysis.

### Phase 1 — Visual Evidence

Analyze a single screenshot for visual characteristics associated with active playback.

Potential signals include:

* Presence of a video frame
* Playback controls
* Progress indicators
* Player UI elements
* Buffering indicators
* Error screens
* Application navigation screens

The result can be represented as:

```js
{
  playback: true,
  score: 0.91,
  reason: "Playback indicators detected"
}
```

The score represents the detector's confidence rather than an absolute measurement.

---

### Phase 2 — Frame Comparison

A single screenshot cannot reliably prove that video is actually progressing.

For example, a paused video and a playing video can look almost identical at one point in time.

The stronger approach is:

```text
Screenshot 1
     │
     ▼
Wait
     │
     ▼
Screenshot 2
     │
     ▼
Compare frames
     │
     ▼
Visual change detected
     │
     ▼
Playback confidence increases
```

This phase will use image comparison to determine whether meaningful visual changes occur between consecutive screenshots.

`pixelmatch` is used for pixel-level image comparison.

---

## Confidence Scoring

Rather than returning only a boolean result, the detector is designed around confidence scoring.

Example:

```text
Visual playback indicators      +0.30
Video content detected           +0.30
Progress indicator detected      +0.15
Frame-to-frame movement          +0.25
----------------------------------------
Total confidence                 1.00
```

A future implementation could classify results using thresholds such as:

```text
0.80 - 1.00    PLAYING
0.50 - 0.79    POSSIBLE_PLAYBACK
0.00 - 0.49    NOT_PLAYING
```

The exact scoring model and thresholds will be validated against real screenshots as the project develops.

---

## Why Screenshot-Based Detection?

Traditional automation often verifies playback indirectly:

```text
click Play
wait 5 seconds
assert something
```

This can become fragile across different devices and application versions.

A visual approach provides an additional layer of validation:

```text
Automation Command
       ↓
Device
       ↓
Screenshot
       ↓
Visual Analysis
       ↓
Playback Confidence
```

The goal is not to replace application-level telemetry or player APIs.

Instead, the detector provides an independent visual signal that can be useful when internal playback state is unavailable.

---

## Technology

* **JavaScript**
* **Node.js**
* **Sharp** — image processing
* **Pixelmatch** — image comparison
* **Node.js Test Runner** — automated tests

---

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd playback-detector
npm install
```

---

## Running the Project

```bash
npm start
```

The application will load a sample screenshot and pass it through the playback detection pipeline.

---

## Development Without a Physical Device

A physical streaming device is not required for development.

The project uses sample screenshots as a substitute for a real screenshot provider:

```text
Sample Screenshot
       ↓
Screenshot Provider
       ↓
Playback Detector
       ↓
Detection Result
```

This allows the image-processing and detection logic to be developed independently.

Put screenshots to compare in `screenshots/`. This is the only folder the
script reads. The loader reads PNG, JPEG, and WebP images, then orders them by
the time each file was saved. The oldest screenshot is therefore compared
before newer screenshots. You do not provide a file path when running the
script.

Once a device integration is available, the screenshot provider can be replaced without changing the detection algorithm.

---

## Testing

Run the automated tests with:

```bash
npm test
```

Tests will eventually cover:

* Playing screenshots
* Paused screenshots
* Buffering screens
* Error screens
* Similar frames
* Significantly different frames
* Confidence-score boundaries

---

## Roadmap

### Phase 1 — Foundation

* [x] JavaScript project structure
* [x] Screenshot abstraction
* [ ] Load sample screenshots
* [ ] Basic playback detection
* [ ] Initial confidence scoring

### Phase 2 — Image Analysis

* [ ] Image preprocessing
* [ ] Region-of-interest analysis
* [ ] Playback UI detection
* [ ] Buffering detection
* [ ] Error-screen detection

### Phase 3 — Temporal Detection

* [ ] Capture consecutive frames
* [ ] Compare screenshots
* [ ] Calculate frame difference
* [ ] Detect meaningful visual movement
* [ ] Combine visual and temporal scores

### Phase 4 — Automation Integration

* [ ] Generic screenshot provider interface
* [ ] Device-specific adapters
* [ ] Integration with external automation frameworks
* [ ] Configurable detection thresholds

---

## Design Principles

### Separation of concerns

Screenshot acquisition should not be coupled to playback detection.

```text
Screenshot Provider
        │
        ▼
Playback Detector
        │
        ▼
Playback Result
```

### Device independence

The detection algorithm should operate on images rather than requiring knowledge of a specific streaming device.

### Explainable results

The detector should provide more than:

```js
true
```

It should provide information about **why** playback was detected and how confident the detector is.

### Testability

The core detection logic should be testable using static screenshots without requiring a physical device.

---

## Example Result

A successful detection may eventually produce:

```js
{
  state: "PLAYING",
  score: 0.94,
  reason: "Video content detected with significant frame-to-frame movement"
}
```

A paused screen could produce:

```js
{
  state: "PAUSED",
  score: 0.87,
  reason: "Video frame detected but no significant frame movement"
}
```

---

## Project Goal

The long-term goal is to create a reusable visual validation component that can answer:

> **"Is the device actually playing video?"**

rather than simply:

> **"Did the automation command execute?"**

This project explores how screenshot analysis, image comparison, and confidence scoring can be combined to make streaming-device automation more reliable.

---

## License

MIT
