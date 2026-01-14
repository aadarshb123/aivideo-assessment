import { useState } from 'react'

function App() {
  const [image, setImage] = useState(null)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Image Segmentation Editor
        </h1>

        <p className="text-gray-400 text-center">
          Upload an image to get started
        </p>
      </div>
    </div>
  )
}

export default App
