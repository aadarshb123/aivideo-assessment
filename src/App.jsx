import { useState } from 'react'
import UploadZone from './components/UploadZone'
import ImageEditor from './components/ImageEditor'

function App() {
  const [image, setImage] = useState(null)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          Image <span style={{ color: '#FF2D7C' }}>Segmentation</span> Editor
        </h1>

        {!image ? (
          <UploadZone onImageUpload={setImage} />
        ) : (
          <ImageEditor image={image} onReset={() => setImage(null)} />
        )}
      </div>
    </div>
  )
}

export default App
