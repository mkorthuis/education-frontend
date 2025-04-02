import '@mui/material/styles';
import '@mui/material/Typography';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    formLabel: React.CSSProperties;
    assessmentTitle: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    formLabel?: React.CSSProperties;
    assessmentTitle?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    formLabel: true;
    assessmentTitle: true;
  }
}
