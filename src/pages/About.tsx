import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Container, List, ListItem, Link } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';

/**
 * About Us page component
 */
const About: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <SectionTitle displayName="Hello" />
      
      <Box sx={{ mb: 5 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Welcome to NHFacts.com, your dedicated resource for easily accessing and understanding publicly available data about New Hampshire schools and districts from the Department of Education.
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          We cut through complexity to present information about New Hampshire schools and districts in a clear, digestible format. We believe that informed parents, educators, and taxpayers are essential for strong communities and effective schools.
        </Typography>

        <Typography variant="body1">
          You can look up any town, district or school, explore statewide data, or ask a question in your own words.
        </Typography>

        <SectionTitle displayName="The Story Behind NHFacts.com" sx={{ mt: 5 }} />
        
        <Typography variant="body1">
          While assisting the Jackson School Board in evaluating high school options for students, I discovered two significant challenges:
        </Typography>
        
        <List sx={{ listStyleType: 'decimal', pl: 4, '& .MuiListItem-root': { py: 0.5 } }}>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              A considerable amount of misinformation existed regarding the status and performance of our schools.
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              Vital data needed to inform discussions and decisions, primarily from the NH Department of Education, was extensive but difficult to find, access, and interpret.
            </Typography>
          </ListItem>
        </List>
        
        <Typography variant="body1">
          Recognizing this gap, I started NHFacts.com as an act of community service – to make valuable data readily available and understandable for communities across New Hampshire.
        </Typography>

        <SectionTitle displayName="Who We Are" sx={{ mt: 5 }} />
        
        <Typography variant="body1">
          Currently, NHFacts.com is developed by Michael Korthuis.
        </Typography>

        <SectionTitle displayName="Data Available" sx={{ mt: 5 }} />
        
        <Typography variant="body1">
          We deliver the following data, for the state as a whole and for each district and school where the state reports it:
        </Typography>
        
        <List sx={{ listStyleType: 'disc', pl: 4, '& .MuiListItem-root': { py: 0.1 }}}>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Academics:</strong> (State, District and School Level) Performance in math, reading, and science, by grade and student group
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Graduation:</strong> (State, District and School Level) Graduation rates, dropouts, post-secondary plans of graduates
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Financials:</strong> (State and District Level) Cost per pupil, detailed expenditure and revenue breakdowns, assets/liabilities
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Staff:</strong> (State and District Level) Teacher salaries, staff composition (teachers vs administrators), teacher education levels, average class size
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Enrollment:</strong> (State, District and School Level) Enrollment by town, school and grade, English learners and low-income students, future projections
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Safety:</strong> (State, District and School Level) Data on bullying, harassment, suspensions/expulsions, restraints/seclusions, and truancy
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Education Freedom Accounts (EFAs):</strong> (State and District Level) EFA students by year and town, and their estimated state cost
            </Typography>
          </ListItem>
        </List>

        <SectionTitle displayName="Ask a Question" sx={{ mt: 5 }} />

        <Typography variant="body1" sx={{ mb: 2 }}>
          On the Ask a Question page, you can ask about any public school district, school or the whole state in your own words, and follow up on the answer. Answers are written by AI using this site's data, with charts, tables and links to the pages and sources they draw on.
        </Typography>

        <Typography variant="body1">
          AI can make mistakes, so check the numbers on the linked pages before relying on them, and please don't include personal details in your questions. The site can answer a limited number of questions each day.
        </Typography>

        <SectionTitle displayName="Our Commitment to Accuracy and Transparency" sx={{ mt: 5 }} />
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Accuracy is paramount. All data comes from publicly available sources provided by the New Hampshire Department of Education or other government entities, such as the U.S. Census Bureau and the National Center for Education Statistics. You can find a detailed list of all data sources used here:{' '}
          <Link component={RouterLink} to="/datasources" color="primary">Data Sources</Link>.
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Our code is open source, allowing anyone to see exactly how data is processed and presented. If you find any issues or discrepancies, please contact us at{' '}
          <Link href="mailto:webmaster@nhfacts.com" color="primary">webmaster@nhfacts.com</Link>.
        </Typography>
        
        <Typography variant="body1">
          Our approach is strictly fact-based and apolitical. We present data without opinion or bias, focusing on providing objective information that allows you to draw your own conclusions.
        </Typography>

        <SectionTitle displayName="Contribute to NHFacts.com" sx={{ mt: 5 }} />
        
        <Typography variant="body1">
          NHFacts.com is growing, and we welcome your help:
        </Typography>
        
        <List sx={{ listStyleType: 'disc', pl: 4, '& .MuiListItem-root': { py: 0.1 }}}>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Developers:</strong> Help add features and improve the platform. Explore our{' '}
              <Link href="https://github.com/mkorthuis/education-backend" color="primary">backend</Link> and{' '}
              <Link href="https://github.com/mkorthuis/education-frontend" color="primary">frontend</Link> code on GitHub.
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Users & Data Enthusiasts:</strong> Report bugs, suggest new features, identify data discrepancies, or help with data verification.
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              <strong>Spread Awareness:</strong> Share NHFacts.com with others who could benefit from easily accessible school data.
            </Typography>
          </ListItem>
        </List>
        
        <Typography variant="body1">
          Contact us at <Link href="mailto:webmaster@nhfacts.com" color="primary">webmaster@nhfacts.com</Link>. Your support, in any form, is greatly appreciated.
        </Typography>

        <SectionTitle displayName="Future Plans" sx={{ mt: 5 }} />
        
        <Typography variant="body1">
          We're continuously working to improve NHFacts.com and plan to add:
        </Typography>
        
        <List sx={{ listStyleType: 'disc', pl: 4, '& .MuiListItem-root': { py: 0.1 }}}>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              National and state-by-state comparisons of test results and school funding
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              District/School level comparison tools
            </Typography>
          </ListItem>
        </List>
        
        <Typography variant="body1">
          Longer term, if there's interest, we hope to:
        </Typography>
        
        <List sx={{ listStyleType: 'disc', pl: 4, '& .MuiListItem-root': { py: 0.1 }}}>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              Incorporate user-generated content to provide additional context from parents, administrators, and taxpayers
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <Typography variant="body1">
              Expand our scope to cover data from other New Hampshire public services
            </Typography>
          </ListItem>
        </List>

        <SectionTitle displayName="Explore NHFacts.com Today" sx={{ mt: 5 }} />
        
        <Typography variant="body1">
          Start discovering the facts about New Hampshire schools now. If you have questions, feedback, or suggestions, please{' '}
          <Link href="mailto:webmaster@nhfacts.com" color="primary">contact us</Link>.
        </Typography>
      </Box>
    </Container>
  );
};

export default About; 