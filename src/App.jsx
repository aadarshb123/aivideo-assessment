import { useState } from 'react'
import UploadZone from './components/UploadZone'
import ImageEditor from './components/ImageEditor'
import { segmentImage } from './services/api'

function App() {
  const [image, setImage] = useState(null)
  const [masks, setMasks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleImageUpload = async (imageDataUrl) => {
    setImage(imageDataUrl)
    setIsLoading(true)
    setError(null)
    setMasks([])

    try {
      const maskUrls = await segmentImage(imageDataUrl)
      setMasks(maskUrls || [])
    } catch (err) {
      console.error('Segmentation failed:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setImage(null)
    setMasks([])
    setError(null)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          Image <span style={{ color: '#FF2D7C' }}>Segmentation</span> Editor
        </h1>

        {!image ? (
          <UploadZone onImageUpload={handleImageUpload} />
        ) : (
          <ImageEditor
            image={image}
            masks={masks}
            isLoading={isLoading}
            error={error}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

export default App
