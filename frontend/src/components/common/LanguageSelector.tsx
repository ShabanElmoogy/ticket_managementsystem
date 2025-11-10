import React from 'react';
import { 
  FormControl, 
  Select, 
  MenuItem, 
  Box, 
  Typography,
  Chip,
  alpha
} from '@mui/material';
import { Language as LanguageIcon, ExpandMore } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '../../i18n';

const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (event: any) => {
    changeLanguage(event.target.value);
  };

  const languages = {
    en: { flag: '🇺🇸', label: 'English', code: 'EN' },
    ar: { flag: '🇸🇦', label: 'العربية', code: 'AR' }
  };

  const currentLang = languages[currentLanguage as keyof typeof languages];

  return (
    <FormControl size="small">
      <Select
        value={currentLanguage}
        onChange={handleLanguageChange}
        displayEmpty
        IconComponent={ExpandMore}
        renderValue={(value) => {
          const lang = languages[value as keyof typeof languages];
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: 'inherit',
                  fontSize: '0.8rem'
                }}
              >
                {lang.code}
              </Typography>
            </Box>
          );
        }}
        sx={{
          minWidth: 85,
          height: 36,
          borderRadius: 2,
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.1),
          border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
          color: 'white',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.2),
            border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
            transform: 'translateY(-1px)',
            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`
          },
          '& .MuiSelect-select': {
            py: 1,
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            '&:focus': {
              backgroundColor: 'transparent'
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none'
          },
          '& .MuiSelect-icon': {
            color: 'white',
            right: 6,
            fontSize: '1.2rem'
          }
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 140,
              boxShadow: (theme) => `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '& .MuiMenuItem-root': {
                py: 1.5,
                px: 2,
                borderRadius: 1,
                mx: 0.5,
                my: 0.25,
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateX(4px)'
                },
                '&.Mui-selected': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.16)
                  }
                }
              }
            }
          }
        }}
      >
        {Object.entries(languages).map(([code, lang]) => (
          <MenuItem key={code} value={code}>
            <Box display="flex" alignItems="center" gap={1.5} width="100%">
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                  {lang.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {lang.code}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;