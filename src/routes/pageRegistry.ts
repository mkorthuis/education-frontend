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
const District = lazy(() => import('@/features/district/pages/District'));

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
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: true,
    },
    financials: {
      id: 'school.financials',
      component: SchoolFinancials,
      urlPatterns: ['/school/:id/financials/:tab?'],
      displayName: 'Financials',
      shortName: 'Financials',
      order: 3,
      requiresId: true,
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: false,
      tooltip: 'Coming Soon',
    },
    demographics: {
      id: 'school.demographics',
      component: SchoolDemographics,
      urlPatterns: ['/school/:id/demographics'],
      displayName: 'Demographics',
      shortName: 'Demographics',
      order: 4,
      requiresId: true,
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
      order: 5,
      requiresId: true,
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: true,
    },
    staff: {
      id: 'school.staff',
      component: SchoolStaff,
      urlPatterns: ['/school/:id/staff'],
      displayName: 'Staff',
      shortName: 'Staff',
      order: 6,
      requiresId: true,
      dataRequirements: {
        school: ['basic'],
        district: ['basic']
      },
      enabled: false,
      tooltip: 'Coming Soon',
    },
    contact: {
      id: 'school.contact',
      component: SchoolContact,
      urlPatterns: ['/school/:id/contact'],
      displayName: 'Contact Information',
      shortName: 'Contact',
      order: 7,
      requiresId: true,
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