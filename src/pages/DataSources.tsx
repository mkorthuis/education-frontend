import React from 'react';
import { Box, Typography, Container, Link, Divider } from '@mui/material';
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
          additionalSourceInfo="For 2018-2026, the disaggregated data files were used. 'Prior years' data used before 2017/2018"
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
          additionalLoadedInfo="2024-2025 is preliminary data; it will be replaced when the state finalizes it."
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
          additionalLoadedInfo="2024-2025 is preliminary data; it will be replaced when the state finalizes it."
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
          originalSource="https://my.doe.nh.gov/myNHDOE/Help/PublicReports.aspx?ReportName=DistrictTown"
          originalSourceText="NH DOE District / Town Report"
          additionalSourceInfo="Only districts and schools on the state's current lists are shown"
          loadedFrom="https://github.com/mkorthuis/education-backend/blob/main/backend/app/alembic/assets/2026-district-list.csv"
          loadedFromText="2026 District List (CSV)"
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
          additionalLoadedInfo="2026-2027 is the state's preliminary count as of August 2, 2026."
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="English Learners"
          description="October 1st counts of English learners for each school district and the state: students eligible for English language services (receiving them, or eligible but not served), and former English learners monitored for four years after reaching proficiency. Reported by district only."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FDemographic%20Data%2FEnrollments%20-%20Demographic%20Categories%2FLimited%20English%20Proficiency%20Enrollment&name=Limited%20English%20Proficiency%20Enrollment&categoryName=Enrollments%20-%20Demographic%20Categories&categoryId=19"
          originalSourceText="NH DOE Limited English Proficiency Enrollment"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/english-learner"
          loadedFromText="English Learner Reports (XSLX)"
          additionalLoadedInfo="Loaded from 2013-2014; the earlier reports have no English learner counts."
        />
        <Divider sx={{ my: 2 }} />

        <DataSourceItem
          title="Financial Reports"
          description="DOE-25 Financial Documents for districts by year"
          originalSource="https://my.doe.nh.gov/iPlatform/DOE25/DOE25Reports"
          originalSourceText="NH DOE iPlatform DOE-25 Reports (XSLX)"
          additionalSourceInfo="One form downloaded for each district for each fiscal year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/finance"
          loadedFromText="DOE-25 Forms (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Free and Reduced School Lunch Eligibility"
          description="October 1st counts of kindergarten through grade 12 students, and those eligible for free or reduced-price lunch, for each school. District figures add up the district's schools; the state figure covers every public school, including academies, charter and interstate schools."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FDemographic%20Data%2FFree%20and%20Reduced%20School%20Lunch%20Eligibility%2FFree%20Reduced%20K-12%20School%20Lunch%20Eligibility%20Rates%20by%20School&name=Free%20Reduced%20K-12%20School%20Lunch%20Eligibility%20Rates%20by%20School&categoryName=Free%20and%20Reduced%20School%20Lunch%20Eligibility&categoryId=18"
          originalSourceText="NH DOE Free Reduced K-12 School Lunch Eligibility Rates by School"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/reduced-lunch"
          loadedFromText="Free and Reduced Lunch Reports (XSLX)"
        />
        <Divider sx={{ my: 2 }} />

        <DataSourceItem
          title="Full Time Staff Count By District"
          description="Reported for each school district is the full time equivalent staff count."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnvironment%20Data%2FStaff%20Reports%2FFull%20Time%20Equivalent%20Staff%20Count%20by%20District&name=Full%20Time%20Equivalent%20Staff%20Count%20by%20District&categoryName=Staff%20Reports&categoryId=27"
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
          originalSource="https://my.doe.nh.gov/myNHDOE/Help/PublicReports.aspx?ReportName=SAUListCSV"
          originalSourceText="NH DOE SAU List (XLS)"
          loadedFrom="https://github.com/mkorthuis/education-backend/raw/refs/heads/main/backend/app/alembic/assets/2026-sau-list.xls"
          loadedFromText="2026 SAU List (XLS)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="School List"
          description="Name of each school, Contact information include the principal, their type, and grade level."
          originalSource="https://my.doe.nh.gov/myNHDOE/Help/PublicReports.aspx?ReportName=SchoolListCSV"
          originalSourceText="NH DOE School List (XLS)"
          additionalSourceInfo="Schools no longer on the state's list keep their history but are not listed"
          loadedFrom="https://github.com/mkorthuis/education-backend/raw/refs/heads/main/backend/app/alembic/assets/2026-school-list.xls"
          loadedFromText="2026 School List (XLS)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="School Metrics"
          description="Multiple metrics to compare schools against."
          originalSource="https://jwt.nh.gov/?src_route=/iExplore/Explore-Dashboard&debug_session=false&toolbar=Hidden&Width=1300px&Height=1600px"
          originalSourceText="NH DOE iExplore Dashboard"
          additionalSourceInfo="Pulled using the download function on the iExplore dashboard."
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets"
          loadedFromText="School Metrics Files"
          additionalLoadedInfo="Files include: 2025-school-metrics.xlsx, 2024-school-metrics.xlsx, 2021-school-metrics.xlsx, and 2018-school-metrics.xlsx"
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
          title="State Proficiency Targets"
          description="The state's interim targets for the percent of students proficient in English language arts and math, from New Hampshire's ESSA Consolidated State Plan. A 2022 amendment approved by the U.S. Department of Education moved the targets two years later because of COVID-19; the final (long-term goal) year is 2026-2027."
          originalSource="https://www.education.nh.gov/sites/g/files/ehbemt326/files/files/inline-documents/essaconsolidatednhstateplan.pdf"
          originalSourceText="NH ESSA Consolidated State Plan (PDF)"
          additionalSourceInfo="Table 1, 'Long-term goals and interim targets for all students in NH', shifted two years"
          loadedFrom="https://github.com/mkorthuis/education-backend/blob/main/backend/app/alembic/assets/state_targets.csv"
          loadedFromText="State Targets (CSV)"
        />
        <Divider sx={{ my: 2 }} />
        <DataSourceItem
          title="State Totals: Public and Private Fall Enrollments"
          description="Statewide October 1 enrollment by grade for each type of school: public district schools, public academies and joint maintenance agreement schools, public charter schools, interstate schools and nonpublic (private) schools. Education Freedom Account students aren't included."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FEnrollment%20Data%2FState%20Totals%2FState%20Totals%20Ten%20Years%20Public%20and%20Private%20Fall%20Enrollments&name=State%20Totals%20Ten%20Years%20Public%20and%20Private%20Fall%20Enrollments&categoryName=State%20Totals&categoryId=12"
          originalSourceText="NH DOE State Totals Ten Years Public and Private Fall Enrollments"
          additionalSourceInfo="Each export covers ten school years; two exports cover 2007-2008 through 2026-2027"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/state-enrollment-type"
          loadedFromText="State Enrollment Totals Reports (XSLX)"
          additionalLoadedInfo="Readiness (a class between kindergarten and grade 1) is counted as grade 1, as the report does."
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
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FFinancial%20Data%2FStaff%20Salary%20Reports%2FTeacher%20Average%20Salary&name=Teacher%20Average%20Salary&categoryName=Staff%20Salary%20Reports&categoryId=15"
          originalSourceText="NH DOE Teacher Average Salary Report"
          additionalSourceInfo="Export function used to download a report for each year"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/staff/teacher-average-salary"
          loadedFromText="Teacher Average Salary (XSLX)"
        />
        <Divider sx={{ my: 2 }} />
        
        <DataSourceItem
          title="Teacher Salary Schedule"
          description="Reported for each school district, the minimum and maximum salary and number of steps for each degree band (Bachelors, Bachelors + 15 and + 30 credits, Masters, Masters + 15, + 30 and + 45 credits), from the teacher salary schedules districts submit each year. Districts that did not report a schedule have no salary band data."
          originalSource="https://my.doe.nh.gov/iPlatform/Report/Report?path=%2FBDMQ%2FiPlatform%20Reports%2FFinancial%20Data%2FStaff%20Salary%20Reports%2FTeacher%20Salary%20Schedule&name=Teacher%20Salary%20Schedule&categoryName=Staff%20Salary%20Reports&categoryId=15"
          originalSourceText="NH DOE Teacher Salary Schedule Report"
          additionalSourceInfo="Export function used to download a report for each year, from 2023-2024"
          loadedFrom="https://github.com/mkorthuis/education-backend/tree/main/backend/app/alembic/assets/staff/teacher-starting-salary"
          loadedFromText="Teacher Salary Schedule Reports (XSLX)"
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