import React from 'react';
import { Box, Typography, Container, Link, Paper, Grid, Divider } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';

/**
 * Data Sources page component
 */
const DataSources: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <SectionTitle displayName="Data Sources" />
      
      <Box sx={{ mb: 5 }}>
        <Typography variant="body1"  sx={{ fontSize: '1.1rem', mb: 3 }}>
          The NH Education Facts website aggregates data from various official sources.
          Below are the data sources we use to provide accurate and reliable information about New Hampshire's education system.
        </Typography> 
        <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 6 }}>
          To simplify processing, each report has been saved as a CSV or XLS file in our GitHub repository.
        </Typography>
        
        <DataSourceItem
          title="Assessment Data"
          description="The results of the state assessment are summarized for each school and each grade. The disaggregated files provide the percent of students who scored at each level on the assessment L4 and L3 being proficient (and above proficient), Level 2 and 1 being below proficient."
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/assessment-data"
          originalSourceText="NH DOE Diaggregated Data (CSV)"
          additionalSourceInfo="For 2018-2024, the disaggregated data files were used. 'Prior years' data used before 2017/2018"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/assessments"
          loadedFromText="Assessment Results (CSV)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Average Class Size By District"
          description="This is a district level report. The average class size is reported for grades 1&2, 3&4, and 5-8."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnvironment%20Data%2FAverage%20Class%20Size%2FAverage%20Class%20Size%20By%20District&name=Average%20Class%20Size%20By%20District&categoryName=Average%20Class%20Size&categoryId=26"
          originalSourceText="NH DOE Avg. Class Size Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/average-class-size/district"
          loadedFromText="Average Class Size By District Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Average Class Size By School"
          description="This is a school level report. The average class size is reported for grades 1&2, 3&4, and 5-8."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnvironment%20Data%2FAverage%20Class%20Size%2FAverage%20Class%20Size%20By%20School&name=Average%20Class%20Size%20By%20School&categoryName=Average%20Class%20Size&categoryId=26"
          originalSourceText="NH DOE Avg. Class Size Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/average-class-size/school"
          loadedFromText="Average Class Size By School Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Cohort Counts By School"
          description="Beginning with 2009-2010, the Department will report the NH Annual Graduate Rate based on a cohort model using US Department of Education established parameters. This report identifies the number of students who graduated in four years with a regular high school diploma or an adult high school diploma and the graduation rate by school and district."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FPerformance%20Data%2FDropouts%20and%20Completers%2FCohort%20Counts%20By%20School&name=Cohort%20Counts%20By%20School&categoryName=Dropouts%20and%20Completers&categoryId=23"
          originalSourceText="NH DOE Cohort Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/cohort-graduation"
          loadedFromText="Cohort Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Completers By Status By School"
          description="Summary of the status of high school graduates & other completers by school"
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FPerformance%20Data%2FDropouts%20and%20Completers%2FCompleters%20By%20Status%20By%20School&name=Completers%20By%20Status%20By%20School&categoryName=Dropouts%20and%20Completers&categoryId=23"
          originalSourceText="NH DOE Completers Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/completers"
          loadedFromText="Completers Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Cost Per Pupil By District"
          description="Cost per Pupil is based on current expenditures as reported on each school district's Annual Financial Report (DOE-25). Cost per pupil represents current expenditures less tuition and transportation costs. Any food service revenue is deducted from current expenditures before dividing by ADM in attendance. Capital and debt service are not current expenditures and are not included."
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/financial-reports"
          originalSourceText="NH DOE Cost Per Pupil Report (XSLX)"
          additionalSourceInfo="Found under the 'Cost Per Pupil By District' heading"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/cost-per-pupil"
          loadedFromText="Cost Per Pupil Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="District List"
          description="Mapping of district id's, their related names, the towns that are encompased by them, the grades their schools support, as well as the SAU they belong to."
          originalSource="https://www.education.nh.gov/sites/g/files/ehbemt326/files/inline-documents/sonh/districttown24-25.pdf"
          originalSourceText="NH DOE District Town List 24-25 (PDF)"
          loadedFrom="https://github.com/mkorthuis/education-backend/blob/main/backend/app/alembic/assets/2025-district-list.csv"
          loadedFromText="2025 District List (CSV)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Early Exit and Dropout Rates Grades 9-12 (2020 or later)"
          description="Dropout numbers and rates are reported by districts operating high schools and for the two public academies."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FPerformance%20Data%2FDropouts%20and%20Completers%2FEarly%20Exit%20and%20Dropout%20Rates%20for%20HS%202020%20or%20later&name=Early%20Exit%20and%20Dropout%20Rates%20for%20Grades%209%20-%2012%20(2020%20or%20later)&categoryName=Dropouts%20and%20Completers&categoryId=23"
          originalSourceText="NH DOE Exit Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/early-exit-dropout"
          loadedFromText="Exit And Dropout Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="EFA Grants"
          description="The calculation of the Education Freedom Accounts pursuant to RSA 194 F:2, I. The data is categorized by municipality where the EFA student resides."
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/other-state-aid-programs#EdFreedomAccounts"
          originalSourceText="NH DOE EFA Grant Reports (XSLX)"
          additionalSourceInfo="Found under the 'Education Freedom Accounts' heading"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/education-freedom-account"
          loadedFromText="EFA Grants (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Financial Reports"
          description="DOE-25 Financial Documents for districts by year"
          originalSource="https://www.education.nh.gov/who-we-are/division-of-education-and-analytic-resources/bureau-school-finance/financial-reporting-requirements"
          originalSourceText="DOE-25 Forms (XSLX)"
          additionalSourceInfo="Script written to pull documents for each district for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/finance"
          loadedFromText="DOE-25 Forms (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Full Time Staff Count By District"
          description="Reported for each school district is the full time equivalent staff count."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnvironment%20Data%2FStaff%20Reports%2FStaff%20Full-time%20Equivalent%20by%20District&name=Full%20Time%20Equivalent%20Staff%20Count%20by%20District&categoryName=Staff%20Reports&categoryId=27"
          originalSourceText="NH DOE Staff Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/staff/staff-count"
          loadedFromText="Staff Counts By District Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Public School Enrollment By Grade"
          description="October 1st enrollments by school by grade are reported for each of the New Hampshire school districts by school."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnrollment%20Data%2FEnrollments%20by%20Grade%2FSchool%20Enrollments%20by%20Grade%20Public&name=Public%20School%20Enrollments%20by%20Grade&categoryName=Enrollments%20by%20Grade&categoryId=10"
          originalSourceText="NH DOE Enrollment Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/enrollments"
          loadedFromText="Enrollment Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="SAU List"
          description="List of SAU's, key officials, and their contact information"
          originalSource="https://my.doe.nh.gov/Profiles/PublicReports/PublicReports.aspx?ReportName=SAUListCSV"
          originalSourceText="NH DOE SAU List (CSV)"
          loadedFrom="https://github.com/mkorthuis/education-backend/raw/refs/heads/main/backend/app/alembic/assets/2025-sau-list.xls"
          loadedFromText="2025 SAU List (XLS)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="School List"
          description="Name of each school, Contact information include the principal, their type, and grade level."
          originalSource="https://my.doe.nh.gov/Profiles/PublicReports/PublicReports.aspx?ReportName=SchoolListCSV"
          originalSourceText="NH DOE School List (XLS)"
          loadedFrom="https://github.com/mkorthuis/education-backend/raw/refs/heads/main/backend/app/alembic/assets/2025-school-list.xls"
          loadedFromText="2025 School List (XLS)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="School Metrics"
          description="Multiple metrics to compare schools against."
          originalSource="https://dashboard.nh.gov/t/DOE/views/iExplore/Explore-Dashboard"
          originalSourceText="NH DOE iExplore Dashboard"
          additionalSourceInfo="Pulled using the download function on the iExplore dashboard."
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets"
          loadedFromText="School Metrics Files"
          additionalLoadedInfo="Files include: 2024-school-metrics.xlsx, 2021-school-metrics.xlsx, and 2018-school-metrics.xlsx"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="School Safety"
          description="The School Safety Data Collection is completed by the school principal or designee and certified by the superintendent at the end of each school year. It includes data concerning restraints and seclusions, harassment, bullying, student discipline, school safety and truancy. The data is used for state and federal reporting and is required under many state and federal laws"
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/school-safety-data-collection"
          originalSourceText="Safety Data (XSLX)"
          additionalSourceInfo="Found under the yearly headings"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/safety"
          loadedFromText="Safety Data Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="State Total Expenditures"
          description="Compilation of each school district's Annual Financial Report (DOE-25) data indicating expenditures and costs at each grade level."
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/financial-reports"
          originalSourceText="NH DOE State Expenditure Files (CSV)"
          additionalSourceInfo="Can be found under the heading 'State Average Cost Per Pupil and Total Expenditures'"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/state-expenditure"
          loadedFromText="State Expenditure Reports (CSV)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Teacher Attainment By District"
          description="Reported for each district are the percent of individuals who hold a Bachelor's, Master's and beyond Master's Degrees. This data has been collected for full and part-time teachers of grades kindergarten through high school (preschool teachers are not included). This data does not include administrators and non-teacher professionals."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnvironment%20Data%2FStaff%20Reports%2FTeacher%20Attainment&name=Teacher%20Attainment&categoryName=Staff%20Reports&categoryId=27"
          originalSourceText="NH DOE Teacher Attainment Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/staff/teacher-attainment"
          loadedFromText="Teacher Attainment By District Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Teacher Average Salary By District"
          description="By district, the number of full-time classroom teachers and their average salary is reported."
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/staffing-and-salary-reports"
          originalSourceText="NH DOE Teacher Salary Report (XSLX)"
          additionalSourceInfo="Can be found under heading 'Teacher Average Salary'"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/staff/teacher-average-salary"
          loadedFromText="Teacher Average Salary (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Teacher Minimum Starting Salary"
          description="Reported for each school district, the minimum starting salary has been extracted from the teacher salary schedules submitted by September of each year. Districts in negotiations will sometimes provide the effective (last year's) salary schedule, while others provide no schedule. Districts that did not provide a schedule are listed as 'N/R' (not reporting)."
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/staffing-and-salary-reports"
          originalSourceText="NH DOE Teacher Minimum Starting Salary Report (XSLX)"
          additionalSourceInfo="Can be found under the heading 'Teacher Minimum Starting Salary'"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/staff/teacher-starting-salary"
          loadedFromText="Teacher Minimum Starting Salary Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Town Enrollments"
          description="Number of students by town. Enrollment totals include out of state students attending NH schools, NH students attending out of state schools and parent paid."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnrollment%20Data%2FEnrollments%20by%20Grade%2FTown%20Level%20Enrollment%20By%20Grade&name=Town%20Enrollment%20By%20Grade&categoryName=Enrollments%20by%20Grade&categoryId=10"
          originalSourceText="NH DOE Town Enrollment By Grade"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/town-enrollments"
          loadedFromText="Town Enrollments Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Valuations, Property Tax Assessments, and School Rates"
          description="For districts, and towns within districts, the following items are reported: assessed valuation, equalized valuation, total tax assessment, school tax assessment, the portion of revenue returned to towns (BPT) to be applied to the school assessment, assessed total tax rate, assessed school tax rate, equalized total tax rate, equalized school tax rates, and the percentage which school tax is of total tax. For more detailed information see the NH School District Profiles."
          originalSource="https://www.education.nh.gov/who-we-are/division-of-educator-and-analytic-resources/bureau-of-education-statistics/financial-reports"
          originalSourceText="NH DOE Assessment Reports (XSLX)"
          additionalSourceInfo="Found under the 'Valuations, Property Tax Assessments, and School Tax Rates' heading"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/equalized-value"
          loadedFromText="Assessments Reports (XSLX)"
        />
        
      </Box>
    </Container>
  );
};

interface DataSourceItemProps {
  title: string;
  description: string;
  originalSource: string;
  originalSourceText: string;
  additionalSourceInfo?: string;
  loadedFrom?: string;
  loadedFromText?: string;
  additionalLoadedInfo?: string;
}

const DataSourceItem: React.FC<DataSourceItemProps> = ({
  title,
  description,
  originalSource,
  originalSourceText,
  additionalSourceInfo,
  loadedFrom,
  loadedFromText,
  additionalLoadedInfo
}) => {
  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      
      <Typography variant="body1">
        {description}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        mt: 1,
        mb: 2
      }}>
        <Box sx={{ flex: 1, mb: { xs: 2, md: 0 }, mr: { xs: 0, md: 2 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Original Source:
          </Typography>
          <Link href={originalSource} target="_blank" rel="noopener noreferrer">
            {originalSourceText}
          </Link>
          {additionalSourceInfo && (
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
              {additionalSourceInfo}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ flex: 1 }}>
          {loadedFrom && loadedFromText && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Loaded From:
              </Typography>
              <Link href={loadedFrom} target="_blank" rel="noopener noreferrer">
                {loadedFromText}
              </Link>
              {additionalLoadedInfo && (
                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                  {additionalLoadedInfo}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default DataSources; 