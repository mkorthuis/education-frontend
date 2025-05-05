import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SectionTitle from '@/components/ui/SectionTitle';

/**
 * Terms of Use page component
 */
const Terms: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <SectionTitle displayName="Terms of Use" />
      
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" gutterBottom>
          Terms of Use for New Hampshire Education Facts
        </Typography>
        
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Effective Date: May 5th 2025
        </Typography>
        
        <Typography paragraph>
          Welcome to New Hampshire Education Facts (nhfacts.com). By using this Website, you agree to follow these simple terms and conditions. If you don't agree, please do not use the Website.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. What This Website Is
          </Typography>
          <Typography paragraph>
            New Hampshire Education Facts provides information, reports, and analysis about education in New Hampshire. The data presented on this site comes primarily from public sources, like the New Hampshire Department of Education (NHDOE). This information is for general knowledge only and is not professional advice.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            2. Your Use of the Website
          </Typography>
          <Typography paragraph>
            You may use the Website for your personal, non-commercial viewing.
          </Typography>
          <Typography paragraph>
            You agree not to:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            • Use the Website for any illegal purpose.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            • Try to hack, disrupt, or harm the Website or its data.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            • Scrape or systematically extract data from the Website content (the reports and layout as displayed on nhfacts.com) beyond normal personal use.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            • Use the Website to send spam or unwanted messages.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            3. About the Code and the Data
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            The Code:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            The underlying software code that powers this Website is open source and available under the MIT License. You can find the terms for using the code in its repository.
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            The Data:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            The raw data used on this site is publicly available from the NHDOE. We do not own this raw data. If you need the original data or want to know its terms of use, please contact the NHDOE directly.
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            The Presentation:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            The way the data is presented, the text, graphics, and layout on nhfacts.com are copyrighted by the Website owner. You can view this content for personal use, but you cannot copy, distribute, or reuse the specific presentation without permission (except as allowed by the open-source code license if applicable to the presentation elements).
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            4. Accuracy and Risk
          </Typography>
          <Typography paragraph>
            The information on this Website is based on external data and our analysis. We try to be accurate, but we cannot guarantee the data is always correct, complete, or up-to-date, especially as it comes from a third party (NHDOE). Your use of this information is at your own risk.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            5. External Links and Embedded Content
          </Typography>
          <Typography paragraph>
            This Website may link to other sites or include content (like maps) from other sites. We are not responsible for the content or privacy practices of those other sites. Your interaction with embedded content is subject to the terms of the site providing it.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            6. Limitation of Responsibility (Disclaimer)
          </Typography>
          <Typography paragraph>
            The Website is provided "as is" without any guarantees. We are not responsible for any problems or damages that might result from using the Website or relying on its content, including any errors in the data.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            7. Children's Privacy
          </Typography>
          <Typography paragraph>
            This Website is not intended for children under 13 years old.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            8. Changes to These Terms
          </Typography>
          <Typography paragraph>
            We may update these Terms at any time by posting the new version here. By continuing to use the Website after changes are posted, you agree to the new Terms.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            9. Governing Law
          </Typography>
          <Typography paragraph>
            These Terms are governed by the laws of the State of New Hampshire, USA.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            10. Privacy
          </Typography>
          <Typography paragraph>
            Your use of the Website is also governed by our <Link component={RouterLink} to="/privacy">Privacy Policy</Link>.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4, mb: 5 }}>
          <Typography variant="h6" gutterBottom>
            11. Contact
          </Typography>
          <Typography paragraph>
            If you have questions about these Terms, please email us at <Link href="mailto:webmaster@nhfacts.com">webmaster@nhfacts.com</Link>.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Terms; 