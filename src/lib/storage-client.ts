import {
  uploadData,
  downloadData,
  remove,
  list,
  getUrl,
} from 'aws-amplify/storage'

// Export storage functions for use throughout the app
export {
  uploadData,
  downloadData,
  remove,
  list,
  getUrl,
}

// Helper function to upload profile picture
export async function uploadProfilePicture(file: File, userId: string) {
  try {
    const result = await uploadData({
      path: `profile-pictures/${userId}/${file.name}`,
      data: file,
      options: {
        contentType: file.type,
      },
    })
    return result
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    throw error
  }
}

// Helper function to export session data
export async function exportSessionData(data: string, userId: string, filename: string) {
  try {
    const result = await uploadData({
      path: `session-exports/${userId}/${filename}`,
      data: new Blob([data], { type: 'application/json' }),
      options: {
        contentType: 'application/json',
      },
    })
    return result
  } catch (error) {
    console.error('Error exporting session data:', error)
    throw error
  }
}