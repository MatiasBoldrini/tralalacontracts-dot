import React, { useState } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { motion } from 'framer-motion'
import { PlayArrow, Pause } from '@mui/icons-material'

interface TralalaIconProps {
  size?: number
  showControls?: boolean
}

const TralalaIcon: React.FC<TralalaIconProps> = ({ size = 60, showControls = false }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'linear-gradient(45deg, #6366f1, #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isHovered ? '0 8px 25px rgba(99, 102, 241, 0.3)' : '0 4px 15px rgba(99, 102, 241, 0.2)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Video placeholder - en una implementación real aquí iría el video */}
        <motion.div
          animate={{
            rotate: isPlaying ? 360 : 0,
            scale: isPlaying ? 1.2 : 1,
          }}
          transition={{
            rotate: { duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" },
            scale: { duration: 0.3 }
          }}
          style={{
            fontSize: size * 0.4,
            color: 'white',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          🎵
        </motion.div>

        {/* Overlay de controles */}
        {showControls && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Tooltip title={isPlaying ? 'Pausar' : 'Reproducir'}>
              <IconButton
                onClick={handlePlayPause}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Efecto de ondas cuando está reproduciendo */}
        {isPlaying && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  width: size,
                  height: size,
                }}
                animate={{
                  scale: [1, 2, 3],
                  opacity: [0.8, 0.4, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </Box>
    </motion.div>
  )
}

export default TralalaIcon



