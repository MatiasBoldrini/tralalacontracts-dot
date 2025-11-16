import React from 'react'
import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'

const VideoHeader: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '275px',
            height: '275px',
            objectFit: 'cover',
          }}
        >
          <source src="/tralala.mp4" type="video/mp4" />
          Tu navegador no soporta el elemento de video.
        </video>

        {/* Título */}
        <Typography
          component="h1"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 600,
          }}
        >
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
              fontWeight: 700,
              color: '#000000',
              lineHeight: 1,
            }}
          >
            TRALALA
          </Typography>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
              fontWeight: 700,
              backgroundColor: '#0047AB',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              marginTop: '8px',
              lineHeight: 1,
            }}
          >
            CONTRACTS
          </Typography>
        </Typography>
      </motion.div>
    </Box>
  )
}

export default VideoHeader



