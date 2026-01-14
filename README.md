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

## Tradeoffs

- **Replicate API Dependency**: Cold starts add 10-30s latency; per-request GPU costs; external availability dependency
- **No Caching**: Identical images are re-processed every upload, wasting cost and time
- **All Masks in Memory**: Loading 50+ masks works for typical images but risks issues on complex scenes

## Next Steps

- **Multi-Select**: Click to lock selection, Shift+click to add masks, enabling composite selections
- **Export**: Download selected mask(s) as PNG with transparent background
- **Mask Caching**: Hash images and store results in Redis/S3 to skip re-processing duplicates

<img width="1919" height="993" alt="Screenshot 2026-01-14 at 4 54 40 PM" src="https://github.com/user-attachments/assets/2a03532b-441e-421f-8dab-430d8ab45b5f" />

<img width="1920" height="975" alt="Screenshot 2026-01-14 at 4 55 03 PM" src="https://github.com/user-attachments/assets/4a1b4563-e4ce-4cc9-bbc3-823f8376ce67" />

<img width="1920" height="988" alt="Screenshot 2026-01-14 at 4 57 05 PM" src="https://github.com/user-attachments/assets/9ec30c24-0732-4dc1-8506-444f7cd2a192" />

<img width="1920" height="994" alt="Screenshot 2026-01-14 at 4 57 19 PM" src="https://github.com/user-attachments/assets/b880a4ef-fcc4-47a6-9368-a675fd77ad08" />





