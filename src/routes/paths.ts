// Define all route paths as constants
export const PATHS = {
    // Public routes
    PUBLIC: {
        HOME: { path: '/', title: 'NH Education Facts' },
        DISTRICT: { path: '/district/:id', title: 'District Overview' },
        DISTRICT_ACADEMIC: { path: '/district/:id/academic', title: 'Academic Performance' },
        DISTRICT_FINANCIALS: { path: '/district/:id/financials', title: 'Financials' },
        DISTRICT_DEMOGRAPHICS: { path: '/district/:id/demographics', title: 'Demographics' },
        DISTRICT_SAFETY: { path: '/district/:id/safety', title: 'Safety' },
        DISTRICT_STAFF: { path: '/district/:id/staff', title: 'Staff' },
        DISTRICT_CONTACT: { path: '/district/:id/contact', title: 'Contact Information' },
        // Add School routes
        SCHOOL: { path: '/school/:id', title: 'School Overview' },
        SCHOOL_ACADEMIC: { path: '/school/:id/academic', title: 'Academic Performance' },
        SCHOOL_FINANCIALS: { path: '/school/:id/financials', title: 'Financials' },
        SCHOOL_DEMOGRAPHICS: { path: '/school/:id/demographics', title: 'Demographics' },
        SCHOOL_SAFETY: { path: '/school/:id/safety', title: 'Safety' },
        SCHOOL_STAFF: { path: '/school/:id/staff', title: 'Staff' },
        SCHOOL_CONTACT: { path: '/school/:id/contact', title: 'Contact Information' }
    },

    // Private routes
    PRIVATE: {
        // Admin section
        ADMIN: {
            ROOT: '/admin',
        }
    },
} as const;

