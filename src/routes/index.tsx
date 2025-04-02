import { createBrowserRouter } from "react-router-dom";
import PrivateLayout from "../components/layout/private/PrivateLayout";
import PublicLayout from "../components/layout/public/PublicLayout";
import { PrivateRoute } from "./PrivateRoute";

import Home from "@/features/Home";
import Admin from "@/features/Admin";
import District from "@/features/district/District";
import AcademicAchievement from "@/features/district/AcademicAchievement";
import Financials from "@/features/district/Financials";
import Demographics from "@/features/district/Demographics";
import SchoolSafety from "@/features/district/SchoolSafety";
import Staff from "@/features/district/Staff";
import ContactInformation from "@/features/district/ContactInformation";
import School from "@/features/school/School";
import SchoolAcademicAchievement from "@/features/school/AcademicAchievement";
import SchoolFinancials from "@/features/school/Financials";
import SchoolDemographics from "@/features/school/Demographics";
import SchoolSafetyInfo from "@/features/school/Safety";
import SchoolStaff from "@/features/school/Staff";
import SchoolContactInformation from "@/features/school/ContactInformation";

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
        { path: PATHS.PUBLIC.DISTRICT_SAFETY.path, element: <SchoolSafety /> },
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