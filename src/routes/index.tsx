import { createBrowserRouter } from "react-router-dom";
import PrivateLayout from "../components/layout/private/PrivateLayout";
import PublicLayout from "../components/layout/public/PublicLayout";
import { PrivateRoute } from "./PrivateRoute";

import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import District from "@/features/district/pages/District";
import AcademicAchievement from "@/features/district/components/AcademicAchievement";
import Financials from "@/features/district/components/Financials";
import Demographics from "@/features/district/components/Demographics";
import Safety from "@/features/district/components/Safety";
import Staff from "@/features/district/components/Staff";
import ContactInformation from "@/features/district/components/ContactInformation";
import School from "@/features/school/pages/School";
import SchoolAcademicAchievement from "@/features/school/components/AcademicAchievement";
import SchoolFinancials from "@/features/school/components/Financials";
import SchoolDemographics from "@/features/school/components/Demographics";
import SchoolSafetyInfo from "@/features/school/components/Safety";
import SchoolStaff from "@/features/school/components/Staff";
import SchoolContactInformation from "@/features/school/components/ContactInformation";

import NotFound from "@components/NotFound/NotFound";
import { PATHS } from './paths';

const router = createBrowserRouter(
  [
    {
      element: <PrivateRoute><PrivateLayout /></PrivateRoute>,
      children: [
        { path: PATHS.PRIVATE.ADMIN.ROOT, element: <Admin /> },
      ],
    },
    {
      element: <PublicLayout />,
      children: [
        { path: PATHS.PUBLIC.HOME.path, element: <Home /> },
        { path: PATHS.PUBLIC.DISTRICT.path, element: <District /> },
        { path: PATHS.PUBLIC.DISTRICT_ACADEMIC.path, element: <AcademicAchievement /> },
        { path: PATHS.PUBLIC.DISTRICT_FINANCIALS.path, element: <Financials /> },
        { path: PATHS.PUBLIC.DISTRICT_DEMOGRAPHICS.path, element: <Demographics /> },
        { path: PATHS.PUBLIC.DISTRICT_SAFETY.path, element: <Safety /> },
        { path: PATHS.PUBLIC.DISTRICT_STAFF.path, element: <Staff /> },
        { path: PATHS.PUBLIC.DISTRICT_CONTACT.path, element: <ContactInformation /> },
        { path: PATHS.PUBLIC.SCHOOL.path, element: <School /> },
        { path: PATHS.PUBLIC.SCHOOL_ACADEMIC.path, element: <SchoolAcademicAchievement /> },
        { path: PATHS.PUBLIC.SCHOOL_FINANCIALS.path, element: <SchoolFinancials /> },
        { path: PATHS.PUBLIC.SCHOOL_DEMOGRAPHICS.path, element: <SchoolDemographics /> },
        { path: PATHS.PUBLIC.SCHOOL_SAFETY.path, element: <SchoolSafetyInfo /> },
        { path: PATHS.PUBLIC.SCHOOL_STAFF.path, element: <SchoolStaff /> },
        { path: PATHS.PUBLIC.SCHOOL_CONTACT.path, element: <SchoolContactInformation /> },
      ]
    },
    {
      path: '*',
      element: <NotFound />
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    } as any
  }
);

export default router;