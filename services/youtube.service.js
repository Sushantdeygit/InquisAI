import { log } from 'console'
import { google } from 'googleapis'
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
})
const fetchYouTubeVideos = async (topics) => {
  log('topics', topics)
  const videoResults = []

  for (const topic of topics) {
    try {
      // Search for videos on the topic
      const searchResponse = await youtube.search.list({
        part: 'snippet',
        q: topic,
        maxResults: 1, // Fetch only the top result
        type: 'video',
        order: 'viewCount', // Sort results by view count
      })

      if (searchResponse.data.items.length === 0) {
        console.log(`No videos found for topic: ${topic}`)
        videoResults.push({ topic, video: null })
        continue
      }

      // Extract the top video item
      const topVideo = searchResponse.data.items[0]

      if (topVideo) {
        // Fetch video statistics for the top video
        const videoDetailsResponse = await youtube.videos.list({
          part: 'statistics',
          id: topVideo.id.videoId,
        })

        // Get statistics for the video
        const videoStatistics =
          videoDetailsResponse.data.items[0]?.statistics || {}

        // Construct video details
        const video = {
          title: topVideo.snippet.title,
          url: `https://www.youtube.com/watch?v=${topVideo.id.videoId}`,
          thumbnail: topVideo.snippet.thumbnails.default.url, // or 'medium', 'high' based on desired resolution
          views: videoStatistics.viewCount || 'N/A',
          likes: videoStatistics.likeCount || 'N/A',
        }

        videoResults.push({ topic, video })
        return videoResults
      } else {
        // Handle case where no videos are found
        videoResults.push({ topic, video: null })
      }
    } catch (error) {
      console.error(`Error fetching video for topic "${topic}":`, error)
      videoResults.push({ topic, video: null }) // Push null for errors
    }
  }

  return videoResults
}

export { fetchYouTubeVideos }
