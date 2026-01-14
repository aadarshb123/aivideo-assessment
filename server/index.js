import express from 'express'
import cors from 'cors'
import Replicate from 'replicate'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const replicate = new Replicate({
  auth: process.env.REPLICATE_TOKEN,
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasToken: !!process.env.REPLICATE_TOKEN })
})

// Segment image endpoint
app.post('/api/segment', async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ error: 'No image provided' })
    }

    const MODEL = "lucataco/segment-anything-2:be7cbde9fdf0eecdc8b20ffec9dd0d1cfeace0832d4d0b58a071d993182e1be0"

    // Use SAM 2 automatic mask generator
    const output = await replicate.run(
      MODEL,
      {
        input: {
          image: image,
          points_per_side: 64,
          points_per_batch: 128,
          pred_iou_thresh: 0.7,
          stability_score_thresh: 0.92,
          stability_score_offset: 0.7,
          crop_n_layers: 1,
          box_nms_thresh: 0.7,
          min_mask_region_area: 25,
          mask_2_mask: true,
          multimask_output: false,
        }
      }
    )

    // Extract URLs from output objects - convert URL objects to strings
    const maskUrls = output.map(item => {
      let url
      if (typeof item.url === 'function') {
        const urlObj = item.url()
        url = urlObj.href || urlObj.toString()
      } else if (item.href) {
        url = item.href
      } else {
        url = String(item)
      }
      return url
    })

    res.json({ masks: maskUrls })

  } catch (error) {
    console.error('Segmentation error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Replicate token: ${process.env.REPLICATE_TOKEN ? 'configured' : 'missing'}`)
})
