import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import { useTranslation } from '../../i18n/LanguageContext'

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
  const { t } = useTranslation()
  const imageSource = typeof photo === 'string' ? photo.trim() : ''
  const [failedImageSource, setFailedImageSource] = useState('')
  const imageError = failedImageSource === imageSource

  if (!imageSource || imageError) {
    return (
      <Avatar
        className={className}
        aria-label={t('common.avatarFor', { name: name || t('common.user') })}
      >
        {getInitials(name)}
      </Avatar>
    )
  }

  return (
    <Avatar
      className={className}
      alt={t('common.photoOf', { name: name || t('common.user') })}
      src={imageSource}
      imgProps={{
        onError: () => setFailedImageSource(imageSource),
      }}
    />
  )
}

export default UserAvatar
