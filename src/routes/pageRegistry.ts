import { lazy } from 'react';

// Define the types for the page registry
export type PageEntry = {
  id: string;
  component: any;
  urlPatterns: string[];
  displayName: string;
  shortName?: string;
  order: number;
  requiresId?: boolean;
  paramExtraction?: {
    districtIdParam?: string;
    schoolIdParam?: string;
  };
  dataRequirements?: {
    district?: string[];
    school?: string[];
  };
  enabled: boolean | ((entity: any) => boolean);
  tooltip?: string | ((entity: any) => string);
};

export type PageCategory = {
  [key: string]: PageEntry;
};

export type PageRegistry = {
  [key: string]: PageCategory;
};

// Import components lazily for better performance
const Home = lazy(() => import('@/pages/Home'));
const DistrictList = lazy(() => import('@/pages/DistrictList'));
const District = lazy(() => import('@/features/district/pages/District'));
const Admin = lazy(() => import('@/pages/Admin'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Contact = lazy(() => import('@/pages/Contact'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const About = lazy(() => import('@/pages/About'));
const DataSources = lazy(() => import('@/pages/DataSources'));
// District components
const AcademicAchievement = lazy(() => import('@/features/district/components/AcademicAchievement'));
const Outcomes = lazy(() => import('@/features/district/components/Outcomes'));
const Financials = lazy(() => import('@/features/district/components/Financials'));
const Demographics = lazy(() => import('@/features/district/components/Demographics'));
const Safety = lazy(() => import('@/features/district/components/Safety'));
const Staff = lazy(() => import('@/features/district/components/Staff'));
const EducationFreedomAccount = lazy(() => import('@/features/district/components/EducationFreedomAccount'));
const ContactInformation = lazy(() => import('@/features/district/components/ContactInformation'));

// School components
const School = lazy(() => import('@/features/school/pages/School'));
const SchoolAcademic = lazy(() => import('@/features/school/components/AcademicAchievement'));
const SchoolOutcomes = lazy(() => import('@/features/school/components/Outcomes'));
const SchoolFinancials = lazy(() => import('@/features/school/components/Financials'));
const SchoolDemographics = lazy(() => import('@/features/school/components/Demographics'));
const SchoolSafety = lazy(() => import('@/features/school/components/Safety'));
const SchoolStaff = lazy(() => import('@/features/school/components/Staff'));
const SchoolContact = lazy(() => import('@/features/school/components/ContactInformation'));

// Create the page registry
export const PAGE_REGISTRY: PageRegistry = {
  general: {
    home: {
      id: 'general.home',
      component: Home,
      urlPatterns: ['/'],
      displayName: 'NH Education Facts',
      order: 1,
      enabled: true,
    },
    about: {
      id: 'general.about',
      component: About,
      urlPatterns: ['/about'],
      displayName: 'About Us',
      order: 2,
      enabled: true,
    },
    districts: {
      id: 'general.districts',
      component: DistrictList,
      urlPatterns: ['/districts'],
      displayName: 'All Districts',
      order: 3,
      enabled: true,
    },
    datasources: {
      id: 'general.datasources',
      component: DataSources,
      urlPatterns: ['/datasources'],
      displayName: 'Data Sources',
      order: 4,
      enabled: true,
    },
    privacy: {
      id: 'general.privacy',
      component: Privacy,
      urlPatterns: ['/privacy'],
      displayName: 'Privacy Policy',
      order: 5,
      enabled: true,
    },
    terms: {
      id: 'general.terms',
      component: Terms,
      urlPatterns: ['/terms'],
      displayName: 'Terms of Use',
      order: 6,
      enabled: true,
    },
    contact: {
      id: 'general.contact',
      component: Contact,
      urlPatterns: ['/contact'],
      displayName: 'Contact Us',
      order: 7,
      enabled: true,
    },
    faq: {
      id: 'general.faq',
      component: FAQ,
      urlPatterns: ['/faq'],
      displayName: 'FAQ',
      order: 8,
      enabled: true,
    },
  },
  
  district: {
    overview: {
      id: 'district.overview',
      component: District,
      urlPatterns: ['/district/:id'],
      displayName: 'District Overview',
      shortName: 'Overview',
      order: 1,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic', 'schools', 'towns', 'sau']
      },
      enabled: true,
    },
    academic: {
      id: 'district.academic',
      component: AcademicAchievement,
      urlPatterns: ['/district/:id/academic/:subjectName?'],
      displayName: 'Academic Performance',
      shortName: 'Academics',
      order: 2,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic', 'schools']
      },
      enabled: (district) => district && district.schools && district.schools.length > 0,
      tooltip: (district) => district.schools && district.schools.length === 0 
        ? 'Your town does not operate schools. Please view the districts who receive your students for information' 
        : '',
    },
    outcomes: {
      id: 'district.outcomes',
      component: Outcomes,
      urlPatterns: ['/district/:id/outcomes'],
      displayName: 'Graduation / College',
      shortName: 'Graduation',
      order: 3,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic', 'schools', 'grades']
      },
      enabled: (district) => {
        const hasSchools = district && district.schools && district.schools.length > 0;
        const hasGraduationGrade = district && district.grades && 
          district.grades.some((grade: any) => grade.name === import.meta.env.VITE_GRADUATION_GRADE);
        return hasSchools && hasGraduationGrade;
      },
      tooltip: (district) => {
        const hasSchools = district && district.schools && district.schools.length > 0;
        const hasGraduationGrade = district && district.grades && 
          district.grades.some((grade: any) => grade.name === import.meta.env.VITE_GRADUATION_GRADE);
        
        if (!hasSchools) {
          return 'Your town does not operate schools. Please view the districts who receive your students for information';
        } else if (!hasGraduationGrade) {
          return `This district does not educate ${import.meta.env.VITE_GRADUATION_GRADE} students. Please view the districts who receive your ${import.meta.env.VITE_GRADUATION_GRADE} students for information.`;
        }
        return '';
      },
    },
    financials: {
      id: 'district.financials',
      component: Financials,
      urlPatterns: ['/district/:id/financials/:tab?'],
      displayName: 'Financials',
      shortName: 'Financials',
      order: 4,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic']
      },
      enabled: true,
    },
    demographics: {
      id: 'district.demographics',
      component: Demographics,
      urlPatterns: ['/district/:id/demographics'],
      displayName: 'Demographics',
      shortName: 'Demographics',
      order: 5,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic']
      },
      enabled: false,
      tooltip: 'Working with NH DOE to fix a bug in their data. Once resolved, demographic data will be available.',
    },
    safety: {
      id: 'district.safety',
      component: Safety,
      urlPatterns: ['/district/:id/safety/:category?'],
      displayName: 'Safety',
      shortName: 'Safety',
      order: 6,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic', 'schools']
      },
      enabled: (district) => district && district.schools && district.schools.length > 0,
      tooltip: (district) => district.schools && district.schools.length === 0 
        ? 'Your town does not operate schools. Please view the districts who receive your students for information' 
        : '',
    },
    staff: {
      id: 'district.staff',
      component: Staff,
      urlPatterns: ['/district/:id/staff'],
      displayName: 'Staff',
      shortName: 'Staff',
      order: 7,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic', 'schools']
      },
      enabled: (district) => district && district.schools && district.schools.length > 0,
      tooltip: (district) => district.schools && district.schools.length === 0 
        ? 'Your town does not operate schools. Please view the districts who receive your students for information' 
        : '',
    },
    efa: {
      id: 'district.efa',
      component: EducationFreedomAccount,
      urlPatterns: ['/district/:id/efa'],
      displayName: 'Education Freedom Accounts',
      shortName: 'EFA\'s',
      order: 8,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic']
      },
      enabled: true,
    },
    contact: {
      id: 'district.contact',
      component: ContactInformation,
      urlPatterns: ['/district/:id/contact'],
      displayName: 'Contact Information',
      shortName: 'Contact',
      order: 9,
      requiresId: true,
      paramExtraction: {
        districtIdParam: 'id'
      },
      dataRequirements: {
        district: ['basic', 'sau']
      },
      enabled: true,
    },
  },
  
  school: {
    overview: {
      id: 'school.overview',
      component: School,
      urlPatterns: ['/school/:id'],
      displayName: 'School Overview',
      shortName: 'Overview',
      order: 1,
      requiresId: true,
      paramExtraction: {
        schoolIdParam: 'id'
      },
      dataRequirements: {
        school: ['basic'],
        district: ['basic', 'sau']
      },
      enabled: true,
    },
    academic: {
      id: 'school.academic',
      component: SchoolAcademic,
      urlPatterns: ['/school/:id/academic/:subjectName?'],
      displayName: 'Academic Performance',
      shortName: 'Academics',
      order: 2,
      requiresId: true,
      paramExtraction: {
        schoolIdParam: 'id'
      },
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: true,
    },
    outcomes: {
      id: 'school.outcomes',
      component: SchoolOutcomes,
      urlPatterns: ['/school/:id/outcomes'],
      displayName: 'Graduation / College',
      shortName: 'Graduation',
      order: 3,
      requiresId: true,
      paramExtraction: {
        schoolIdParam: 'id'
      },
      dataRequirements: {
        school: ['basic', 'grades']
      },
      enabled: (school) => {
        const hasGraduationGrade = school && school.grades && 
          school.grades.some((grade: any) => grade.name === import.meta.env.VITE_GRADUATION_GRADE);
        return hasGraduationGrade;
      },
      tooltip: (school) => {
        const hasGraduationGrade = school && school.grades && 
          school.grades.some((grade: any) => grade.name === import.meta.env.VITE_GRADUATION_GRADE);
        
        if (!hasGraduationGrade) {
          return `This school does not educate ${import.meta.env.VITE_GRADUATION_GRADE} students.`;
        }
        return '';
      },
    },
    demographics: {
      id: 'school.demographics',
      component: SchoolDemographics,
      urlPatterns: ['/school/:id/demographics'],
      displayName: 'Demographics',
      shortName: 'Demographics',
      order: 5,
      requiresId: true,
      paramExtraction: {
        schoolIdParam: 'id'
      },
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: false,
      tooltip: 'Coming Soon',
    },
    safety: {
      id: 'school.safety',
      component: SchoolSafety,
      urlPatterns: ['/school/:id/safety/:category?'],
      displayName: 'Safety',
      shortName: 'Safety',
      order: 6,
      requiresId: true,
      paramExtraction: {
        schoolIdParam: 'id'
      },
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: true,
    },
    contact: {
      id: 'school.contact',
      component: SchoolContact,
      urlPatterns: ['/school/:id/contact'],
      displayName: 'Contact Information',
      shortName: 'Contact',
      order: 8,
      requiresId: true,
      paramExtraction: {
        schoolIdParam: 'id'
      },
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: true,
    },
  },
  
  admin: {
    root: {
      id: 'admin.root',
      component: lazy(() => import('@/pages/Admin')),
      urlPatterns: ['/admin'],
      displayName: 'Admin Dashboard',
      order: 1,
      enabled: true,
    },
  }
};

// Helper function to get a flat list of all pages
export const getAllPages = (): PageEntry[] => {
  return Object.values(PAGE_REGISTRY).flatMap(category => 
    Object.values(category)
  );
};

// Helper function to get all URL patterns
export const getAllUrlPatterns = (): string[] => {
  return getAllPages().flatMap(page => page.urlPatterns);
};

// Helper function to find a page entry by URL pattern
export const findPageByUrl = (url: string): PageEntry | undefined => {
  return getAllPages().find(page => 
    page.urlPatterns.some(pattern => {
      // Convert route pattern to regex for matching
      const regexPattern = pattern
        .replace(/:\w+\?/g, '[^/]*') // Optional parameters
        .replace(/:\w+/g, '[^/]+');  // Required parameters
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(url);
    })
  );
};

// Helper function to extract IDs from URL
export const extractIdsFromUrl = (url: string): { districtId?: number, schoolId?: number } => {
  const result: { districtId?: number, schoolId?: number } = { };
  
  // Direct pattern matching for common URLs to avoid regex issues
  if (url.match(/^\/district\/(\d+)(\/.*)?$/)) {
    const match = url.match(/^\/district\/(\d+)(\/.*)?$/);
    if (match && match[1]) {
      result.districtId = parseInt(match[1]);
      return result;
    }
  }
  
  if (url.match(/^\/school\/(\d+)(\/.*)?$/)) {
    const match = url.match(/^\/school\/(\d+)(\/.*)?$/);
    if (match && match[1]) {
      result.schoolId = parseInt(match[1]);
      return result;
    }
  }
  
  // Continue with the more detailed pattern matching as a fallback
  for (const category of Object.values(PAGE_REGISTRY)) {
    for (const pageKey of Object.keys(category)) {
      const pageEntry = category[pageKey];
      // Skip if no param extraction defined
      if (!pageEntry.paramExtraction) continue;
      
      // Try to match URL with each pattern
      for (const pattern of pageEntry.urlPatterns) {
        // Convert route pattern to regex for matching
        const regexPattern = pattern
          .replace(/:\w+\?/g, '([^/]*)') // Optional parameters
          .replace(/:\w+/g, '([^/]+)');  // Required parameters
        
        // Create regex with the properly converted pattern - no escaping needed
        const regex = new RegExp(`^${regexPattern}$`);
        
        const match = regex.exec(url);
        
        if (match) {
          // Extract parameter values
          const paramNames = (pattern.match(/:\w+(\?)?/g) || [])
            .map(param => param.replace(/^:/, '').replace(/\?$/, ''));
          
          // Create params object from match groups
          const params: Record<string, string> = {};
          paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });
          
          // Extract district ID if configured
          if (pageEntry.paramExtraction.districtIdParam && 
              params[pageEntry.paramExtraction.districtIdParam]) {
            result.districtId = parseInt(params[pageEntry.paramExtraction.districtIdParam]);
          }
          
          // Extract school ID if configured
          if (pageEntry.paramExtraction.schoolIdParam && 
              params[pageEntry.paramExtraction.schoolIdParam]) {
            result.schoolId = parseInt(params[pageEntry.paramExtraction.schoolIdParam]);
          }
          
          // Return early once we find a match
          return result;
        }
      }
    }
  }
  
  return result;
}; 