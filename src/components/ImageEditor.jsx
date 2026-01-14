function ImageEditor({ image, onReset }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div
          className="relative inline-block rounded-lg overflow-hidden"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          <img
            src={image}
            alt="Uploaded"
            className="max-w-full"
          />
        </div>
      </div>
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
