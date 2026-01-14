import { useState, useEffect, useRef, useCallback } from 'react'

// Generate distinct hue values for masks using golden angle distribution
function generateHue(index) {
  return (index * 137.5) % 360
}

// Calculate how many WHITE pixels are in a mask (SAM masks are white-on-black)
function calculateMaskArea(imageData, threshold) {
  let count = 0
  const data = imageData.data
  // Check RGB values - white pixels have high R, G, B values
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Consider pixel as part of mask if it's brighter than threshold
    if (r > threshold && g > threshold && b > threshold) {
      count++
    }
  }
  return count
}

function ImageEditor({ image, masks, isLoading, error, onReset }) {
  const imageRef = useRef(null)
  const canvasRef = useRef(null)
  const [rawMasks, setRawMasks] = useState([]) // Loaded mask images (don't reload)
  const [maskData, setMaskData] = useState([]) // Filtered & processed masks
  const [activeMask, setActiveMask] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [threshold, setThreshold] = useState(128) // Threshold for mask detection (128 works for binary masks)
  const [opacity, setOpacity] = useState(128) // Overlay opacity (0-255)

  // Load mask images ONCE when masks prop changes
  useEffect(() => {
    if (!masks || masks.length === 0) {
      setRawMasks([])
      setMaskData([])
      return
    }

    const loadMasks = async () => {

      const loadedMasks = await Promise.all(
        masks.map(async (maskUrl, index) => {
          return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              // Scale down large images to prevent memory issues
              const maxSize = 1024
              let width = img.width
              let height = img.height

              if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height)
                width = Math.floor(width * scale)
                height = Math.floor(height * scale)
              }

              const canvas = document.createElement('canvas')
              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, width, height)
              const imageData = ctx.getImageData(0, 0, width, height)

              resolve({
                index,
                url: maskUrl,
                imageData,
                width,
                height,
                totalPixels: width * height,
              })
            }
            img.onerror = () => resolve(null)
            img.src = maskUrl
          })
        })
      )

      const validMasks = loadedMasks.filter(Boolean)
      setRawMasks(validMasks)
    }

    loadMasks()
  }, [masks]) // Only reload when masks URLs change

  // Process masks when threshold changes (fast - no reloading)
  useEffect(() => {
    if (!rawMasks.length) {
      setMaskData([])
      return
    }

    // Calculate areas and filter
    const processed = rawMasks.map(mask => {
      const area = calculateMaskArea(mask.imageData, threshold)
      const areaPercent = (area / mask.totalPixels) * 100
      return { ...mask, area, areaPercent }
    })

    // Filter out masks that cover more than 80% (likely background)
    // and sort by area (smallest first)
    const filtered = processed
      .filter(m => m.areaPercent < 80 && m.areaPercent > 0.1) // Also filter out tiny masks
      .sort((a, b) => a.area - b.area)

    // Assign hue values for coloring
    const withColors = filtered.map((mask, i) => ({
      ...mask,
      hue: generateHue(i)
    }))

    setMaskData(withColors)
  }, [rawMasks, threshold]) // Recalculate when raw masks load OR threshold changes

  // Track image size when it loads
  const handleImageLoad = (e) => {
    setImageSize({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    })
  }

  // Check which mask contains the pixel at given coordinates
  // Masks are already sorted by area (smallest first), so we check smallest first
  const getMaskAtPoint = useCallback((x, y) => {
    if (!maskData.length || !imageRef.current) return null

    const img = imageRef.current
    const rect = img.getBoundingClientRect()

    // Convert screen coordinates to image coordinates
    const scaleX = imageSize.width / rect.width
    const scaleY = imageSize.height / rect.height
    const imgX = Math.floor((x - rect.left) * scaleX)
    const imgY = Math.floor((y - rect.top) * scaleY)

    // Check each mask (smallest first to prioritize specific objects over backgrounds)
    for (const mask of maskData) {
      if (!mask.imageData) continue

      // Scale to mask coordinates (masks might have different dimensions)
      const maskX = Math.floor((imgX / imageSize.width) * mask.width)
      const maskY = Math.floor((imgY / imageSize.height) * mask.height)

      if (maskX >= 0 && maskX < mask.width && maskY >= 0 && maskY < mask.height) {
        const pixelIndex = (maskY * mask.width + maskX) * 4
        const r = mask.imageData.data[pixelIndex]
        const g = mask.imageData.data[pixelIndex + 1]
        const b = mask.imageData.data[pixelIndex + 2]

        // Check if pixel is white (part of the mask) - SAM masks are white-on-black
        if (r > threshold && g > threshold && b > threshold) {
          return mask
        }
      }
    }
    return null
  }, [maskData, imageSize, threshold])

  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    if (isLoading || !maskData.length) return
    const mask = getMaskAtPoint(e.clientX, e.clientY)
    setActiveMask(mask)
  }, [getMaskAtPoint, isLoading, maskData.length])

  const handleMouseLeave = () => {
    setActiveMask(null)
  }

  // Draw active mask overlay
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    const rect = img.getBoundingClientRect()

    canvas.width = rect.width
    canvas.height = rect.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (activeMask && activeMask.imageData) {
      // Create a new ImageData where we convert white-on-black to colored-on-transparent
      const maskData = activeMask.imageData
      const coloredMask = new ImageData(maskData.width, maskData.height)

      // Get the hue value
      const hue = activeMask.hue || 0
      // Convert HSL to RGB for the overlay color
      const h = hue / 360
      const s = 0.7
      const l = 0.55
      let r, g, b
      if (s === 0) {
        r = g = b = l
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1/6) return p + (q - p) * 6 * t
          if (t < 1/2) return q
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
          return p
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
      }

      // Convert each pixel: white -> colored with alpha, black -> transparent
      for (let i = 0; i < maskData.data.length; i += 4) {
        const maskR = maskData.data[i]
        const maskG = maskData.data[i + 1]
        const maskB = maskData.data[i + 2]

        // If pixel is white (part of mask), make it colored with transparency
        if (maskR > threshold && maskG > threshold && maskB > threshold) {
          coloredMask.data[i] = Math.floor(r * 255)     // R
          coloredMask.data[i + 1] = Math.floor(g * 255) // G
          coloredMask.data[i + 2] = Math.floor(b * 255) // B
          coloredMask.data[i + 3] = opacity              // Alpha (controlled by slider)
        } else {
          // Black pixel -> fully transparent
          coloredMask.data[i] = 0
          coloredMask.data[i + 1] = 0
          coloredMask.data[i + 2] = 0
          coloredMask.data[i + 3] = 0
        }
      }

      // Draw the colored mask to a temp canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = maskData.width
      tempCanvas.height = maskData.height
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.putImageData(coloredMask, 0, 0)

      // Draw scaled to display size
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height)
    }
  }, [activeMask, threshold, opacity])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="relative inline-block rounded-lg overflow-hidden"
          style={{ backgroundColor: '#1A1A1A' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img
            ref={imageRef}
            src={image}
            alt="Uploaded"
            className="max-w-full block"
            onLoad={handleImageLoad}
          />

          {/* Mask overlay canvas */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#FF2D7C', borderTopColor: 'transparent' }}></div>
                <p className="text-white text-sm">Analyzing image...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status info */}
      <div className="text-center">
        {error && (
          <p className="text-red-400 text-sm mb-2">Error: {error}</p>
        )}
        {!isLoading && masks.length > 0 && (
          <p className="text-sm mb-2" style={{ color: '#A0A0A0' }}>
            Found {masks.length} objects ({maskData.length} after filtering). Hover to highlight.
          </p>
        )}
      </div>

      {/* Opacity slider */}
      {!isLoading && masks.length > 0 && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm" style={{ color: '#A0A0A0' }}>
              Overlay Opacity
            </label>
            <span className="text-sm font-mono" style={{ color: '#FF2D7C' }}>
              {Math.round((opacity / 255) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="230"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FF2D7C 0%, #FF2D7C ${((opacity - 30) / 200) * 100}%, #2A2A2A ${((opacity - 30) / 200) * 100}%, #2A2A2A 100%)`
            }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#A0A0A0' }}>
            <span>Subtle</span>
            <span>Solid</span>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onReset}
          style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
          className="px-4 py-2 border rounded-lg transition-all duration-200 hover:border-[#FF2D7C]/50"
        >
          Upload Different Image
        </button>
      </div>
    </div>
  )
}

export default ImageEditor
