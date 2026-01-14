import { useState, useRef } from 'react'

function UploadZone({ onImageUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onImageUpload(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    handleFile(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onClick={handleUploadClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        backgroundColor: isDragging ? 'rgba(255, 45, 124, 0.1)' : '#1A1A1A',
        borderColor: isDragging ? '#FF2D7C' : '#2A2A2A',
      }}
      className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 hover:border-[#FF2D7C]/50"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      <div style={{ color: '#A0A0A0' }}>
        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg mb-2 text-white">Drop an image here or click to upload</p>
        <p className="text-sm" style={{ color: '#A0A0A0' }}>Supports JPG, PNG, WebP</p>
      </div>
    </div>
  )
}

export default UploadZone
