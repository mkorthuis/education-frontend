import React from 'react';
import { Box, Typography, Container, Divider } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';

/**
 * Privacy Policy page component
 */
const Privacy: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <SectionTitle displayName="Privacy Policy" />
      
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" gutterBottom>
          Privacy Policy for New Hampshire Education Facts
        </Typography>
        
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Effective Date: May 4th, 2025
        </Typography>
        
        <Typography paragraph>
          Welcome to New Hampshire Education Facts (nhfacts.com). This Privacy Policy explains how we collect, use, and protect your information when you visit our website.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Who We Are
          </Typography>
          <Typography paragraph>
            New Hampshire Education Facts is a website personally owned and operated, providing reports and analytics about education in New Hampshire.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            2. Information We Collect
          </Typography>
          <Typography paragraph>
            We collect two main types of information from our users:
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            Information You Voluntarily Provide:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            We collect information that you directly give us when you use our website.
          </Typography>
          <Typography paragraph sx={{ ml: 4 }}>
            <b>Contact Form:</b> If you use our contact form to ask a question or provide feedback, we collect the email address you provide so we can respond to you.
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            Information Collected Automatically:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            When you visit our website, certain information is collected automatically through cookies and analytics tools.
          </Typography>
          <Typography paragraph sx={{ ml: 4 }}>
            <b>IP Address:</b> We collect your IP address, which is a numerical label assigned to your device when it connects to the internet.
          </Typography>
          <Typography paragraph sx={{ ml: 4 }}>
            <b>Browsing Data:</b> We collect data about how you interact with our website, such as the pages you visit, the time spent on those pages, your navigation paths, and device information (like browser type). This is primarily collected via Google Analytics.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            3. How We Collect Your Information
          </Typography>
          <Typography paragraph>
            We collect information in the following ways:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>Directly from You:</b> When you submit information through our contact form.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>Automatically:</b> As you navigate the website through the use of cookies, server logs, and analytics tools like Google Analytics and Cloudflare.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            4. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use the information we collect for the following purposes:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>To Provide and Operate the Website:</b> Ensuring the website functions correctly and is accessible to users.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>To Improve, Personalize, and Expand the Website:</b> Analyzing user behavior to understand what content is popular, identify technical issues, and plan future updates.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>To Understand and Analyze How You Use Our Website (Analytics):</b> Using tools like Google Analytics to gather insights into website traffic and user engagement patterns.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>To Communicate With You:</b> Responding to your inquiries and feedback submitted through the contact form.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            5. Sharing Your Information
          </Typography>
          <Typography paragraph>
            We do not share your personal information with third parties for their marketing or other purposes.
          </Typography>
          <Typography paragraph>
            We do not sell your personal information.
          </Typography>
          <Typography paragraph>
            Your information is not shared except potentially in limited circumstances such as:
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            • If required by law or legal process (e.g., subpoena, court order).
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            • To protect our rights, privacy, safety, or property, and/or that of our affiliates, you, or others.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            • In connection with a corporate transaction, such as a sale, merger, or asset transfer, where the information may be transferred to the new owner.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            6. Data Retention
          </Typography>
          <Typography paragraph>
            We retain the personal information we collect (primarily IP addresses and browsing data for analytics, and contact form emails for communication purposes) for no more than one year. After this period, the data is typically deleted or anonymized.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            7. Data Security
          </Typography>
          <Typography paragraph>
            We take reasonable measures to protect the personal information we collect from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            8. Cookies and Tracking Technologies
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>Cookies:</b> We use cookies, which are small text files placed on your device. Cookies help us operate the website and provide analytics data. Some cookies are essential for the website to function properly, while others are used for tracking website usage via Google Analytics.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>Google Analytics:</b> We use Google Analytics to understand how visitors interact with our site. Google Analytics uses cookies to collect information about your use of the website, such as your IP address and pages visited. This information is transmitted to and stored by Google.
          </Typography>
          <Typography paragraph sx={{ ml: 2 }}>
            <b>Managing Cookies:</b> Most web browsers are set to accept cookies by default. You can usually adjust your browser settings to remove or reject browser cookies. Please note that removing or rejecting cookies may affect the availability and functionality of our website. For more information on how Google uses data from Google Analytics, you can visit Google's privacy policy.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            9. Embedded Content from Other Websites
          </Typography>
          <Typography paragraph>
            Articles or pages on this site may include embedded content (e.g. Google Maps). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.
          </Typography>
          <Typography paragraph>
            These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website. We recommend reviewing the privacy policies of these third parties.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            10. Children's Privacy
          </Typography>
          <Typography paragraph>
            Our website is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13 without verification of parental consent, we will take steps to remove that information from our servers.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            11. Your Privacy Rights
          </Typography>
          <Typography paragraph>
            While our target audience is in New Hampshire, users from other locations may visit the site and may have specific rights regarding their personal data under applicable laws (such as the right to access, correct, or request deletion of their data).
          </Typography>
          <Typography paragraph>
            If you have questions about the data we hold about you or wish to exercise any rights you may have under applicable law, please contact us using the information below.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            12. Changes to This Privacy Policy
          </Typography>
          <Typography paragraph>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this policy. We encourage you to review this Privacy Policy periodically for any changes. Your continued use of the website after any changes means you accept the updated policy.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4, mb: 5 }}>
          <Typography variant="h6" gutterBottom>
            13. Contact Us
          </Typography>
          <Typography paragraph>
            If you have any questions about this Privacy Policy, please contact us by email at:
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            webmaster@nhfacts.com
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Privacy; 