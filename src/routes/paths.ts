// Define all route paths as constants
export const PATHS = {
    // Public routes
    PUBLIC: {
        HOME: { path: '/', title: 'NH Education Facts' },
        DISTRICT: { path: '/district/:id', title: 'District Overview', shortName: 'Overview' },
        DISTRICT_ACADEMIC: { path: '/district/:id/academic/:subjectName?', title: 'Academic Performance', shortName: 'Academics' },
        DISTRICT_OUTCOMES: { path: '/district/:id/outcomes', title: 'Graduation / College', shortName: 'Graduation' },
        DISTRICT_FINANCIALS: { path: '/district/:id/financials/:tab?', title: 'Financials', shortName: 'Financials' },
        DISTRICT_DEMOGRAPHICS: { path: '/district/:id/demographics', title: 'Demographics', shortName: 'Demographics' },
        DISTRICT_SAFETY: { path: '/district/:id/safety/:category?', title: 'Safety', shortName: 'Safety' },
        DISTRICT_STAFF: { path: '/district/:id/staff', title: 'Staff', shortName: 'Staff' },
        DISTRICT_EFA: { path: '/district/:id/efa', title: 'Education Freedom Accounts', shortName: 'EFA\'s' },
        DISTRICT_CONTACT: { path: '/district/:id/contact', title: 'Contact Information', shortName: 'Contact' },
        // Add School routes
        SCHOOL: { path: '/school/:id', title: 'School Overview', shortName: 'Overview' },
        SCHOOL_ACADEMIC: { path: '/school/:id/academic/:subjectName?', title: 'Academic Performance', shortName: 'Academics' },
        SCHOOL_FINANCIALS: { path: '/school/:id/financials/:tab?', title: 'Financials', shortName: 'Financials' },
        SCHOOL_DEMOGRAPHICS: { path: '/school/:id/demographics', title: 'Demographics', shortName: 'Demographics' },
        SCHOOL_SAFETY: { path: '/school/:id/safety/:category?', title: 'Safety', shortName: 'Safety' },
        SCHOOL_STAFF: { path: '/school/:id/staff', title: 'Staff', shortName: 'Staff' },
        SCHOOL_CONTACT: { path: '/school/:id/contact', title: 'Contact Information', shortName: 'Contact' }
    },

    // Private routes
    PRIVATE: {
        // Admin section
        ADMIN: {
            ROOT: '/admin',
        }
    },
} as const;

