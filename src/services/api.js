const API_BASE = 'http://localhost:3001'

export async function segmentImage(imageDataUrl) {
  const response = await fetch(`${API_BASE}/api/segment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageDataUrl }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Segmentation failed')
  }

  const data = await response.json()
  return data.masks
}

