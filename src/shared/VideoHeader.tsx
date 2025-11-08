import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'

const VideoHeader: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        backgroundImage: `
          radial-gradient(circle at 25% 25%, #f0f0f0 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, #f5f5f5 0%, transparent 50%)
        `,
        overflow: 'hidden',
      }}
    >
      {/* Video del tiburón */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: 'relative',
          width: '300px',
          height: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          }}
        >
          <source src="/videos/tralala.mp4" type="video/mp4" />
          Tu navegador no soporta el elemento de video.
        </video>
      </motion.div>

      {/* Texto TRALALA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{ marginTop: '20px' }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
            fontWeight: 900,
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            lineHeight: 0.9,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          TRALALA
        </Typography>
      </motion.div>

      {/* Botón CONTRACTS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        style={{ marginTop: '10px' }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            fontSize: '1.2rem',
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            padding: '12px 32px',
            borderRadius: '8px',
            textTransform: 'none',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 15px rgba(30, 58, 138, 0.3)',
            '&:hover': {
              backgroundColor: '#1e40af',
              boxShadow: '0 6px 20px rgba(30, 58, 138, 0.4)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          CONTRACTS
        </Button>
      </motion.div>

      {/* Elemento decorativo en la esquina superior derecha */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          backgroundColor: '#e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '1.2rem',
            color: '#6b7280',
            fontWeight: 600,
          }}
        >
          ▼
        </Typography>
      </motion.div>
    </Box>
  )
}

export default VideoHeader



