# Image Segmentation Editor

A web application that automatically detects objects in images and highlights them on hover.

## How It Works

1. Upload an image via drag-and-drop or file selection
2. The image is sent to a SAM 2 (Segment Anything Model) API which returns individual mask images for each detected object
3. Masks are filtered to remove background regions (>80% coverage) and noise (<0.1% coverage)
4. Hover over the image to highlight detected objects with a colored overlay

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js (proxies API requests to hide credentials)
- **Segmentation**: Replicate API hosting Meta's SAM 2 model

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with your Replicate API token:
   ```
   REPLICATE_TOKEN=your_token_here
   ```

3. Start the backend server:
   ```
   npm run server
   ```

4. In a separate terminal, start the frontend:
   ```
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Project Structure

```
src/
  App.jsx              # Main component, handles state and API calls
  components/
    UploadZone.jsx     # Drag-and-drop image upload
    ImageEditor.jsx    # Image display, mask processing, hover detection
  services/
    api.js             # API client for backend
server/
  index.js             # Express server, proxies Replicate API calls
```