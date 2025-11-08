import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
  Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import { AutoAwesome, Lightbulb, ArrowForward } from '@mui/icons-material'
import { WIZARD_TEMPLATES, WizardTemplate } from '../utils/blocklyWizard'

interface ContractWizardProps {
  open: boolean
  onSelectTemplate: (template: WizardTemplate) => void
  onSkip: () => void
}

const ContractWizard: React.FC<ContractWizardProps> = ({ open, onSelectTemplate, onSkip }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<WizardTemplate | null>(null)

  const handleSelectTemplate = (template: WizardTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
    }
  }

  const handleClose = () => {
    setSelectedTemplate(null)
  }

  return (
    <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <AutoAwesome sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5">Constructor Visual de Contratos Inteligentes</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Elige una plantilla para comenzar. Puedes personalizar cualquier aspecto después.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 4 }}>
        {!selectedTemplate ? (
          // Vista de selección de plantillas
          <Box>
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'info.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Lightbulb sx={{ color: 'info.main', mt: 0.5, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary">
                  Las plantillas incluyen bloques predefinidos que puedes editar, agregar o eliminar según tus necesidades.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {WIZARD_TEMPLATES.map((template, index) => (
                <Box key={template.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Card
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        transition: 'all 0.2s',
                        border: '2px solid transparent',
                        '&:hover': {
                          boxShadow: 4,
                          borderColor: 'primary.main',
                          transform: 'translateY(-4px)',
                        },
                      }}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Typography variant="h2" sx={{ fontSize: '2.5rem' }}>
                            {template.icon}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {template.name}
                            </Typography>
                            <Chip label={`${template.blocks.length} bloques`} size="small" />
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                          Bloques incluidos:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {template.blocks.slice(0, 4).map((block, i) => (
                            <Chip
                              key={i}
                              label={block.type.replace(/_/g, ' ')}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          ))}
                          {template.blocks.length > 4 && (
                            <Chip
                              label={`+${template.blocks.length - 4} más`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          // Vista de confirmación
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{ p: 3, backgroundColor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h2" sx={{ fontSize: '3rem' }}>
                  {selectedTemplate.icon}
                </Typography>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {selectedTemplate.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plantilla seleccionada
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedTemplate.description}
              </Typography>

              <Box sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Bloques que se cargarán:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTemplate.blocks.map((block, i) => (
                    <Chip
                      key={i}
                      label={block.type.replace(/_/g, ' ').toUpperCase()}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 3, p: 2, backgroundColor: 'success.50', borderRadius: 1, borderLeft: '3px solid', borderColor: 'success.main' }}>
                <Typography variant="body2" color="success.dark">
                  ✓ Puedes agregar, eliminar o modificar cualquier bloque después de cargar la plantilla.
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {selectedTemplate ? (
          <>
            <Button onClick={handleClose} variant="outlined">
              Elegir otra plantilla
            </Button>
            <Button onClick={handleConfirm} variant="contained" endIcon={<ArrowForward />}>
              Usar esta plantilla
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onSkip} variant="text">
              Empezar vacío
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Selecciona una plantilla para continuar
            </Typography>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ContractWizard
