import { useState } from 'react'
import Avatar from '@mui/material/Avatar'

function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return 'U'
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function UserAvatar({ name, photo, className }) {
  const imageSource = typeof photo === 'string' ? photo.trim() : ''
  const [failedImageSource, setFailedImageSource] = useState('')
  const imageError = failedImageSource === imageSource

  if (!imageSource || imageError) {
    return (
      <Avatar className={className} aria-label={`Avatar for ${name || 'user'}`}>
        {getInitials(name)}
      </Avatar>
    )
  }

  return (
    <Avatar
      className={className}
      alt={`Photo of ${name || 'user'}`}
      src={imageSource}
      imgProps={{
        onError: () => setFailedImageSource(imageSource),
      }}
    />
  )
}

export default UserAvatar
