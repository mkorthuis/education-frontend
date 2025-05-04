import { createBrowserRouter } from "react-router-dom";
import PrivateLayout from "../components/layout/private/PrivateLayout";
import PublicLayout from "../components/layout/public/PublicLayout";
import { PrivateRoute } from "./PrivateRoute";
import NotFound from "@components/NotFound/NotFound";
import { PAGE_REGISTRY } from './pageRegistry';

// Create router using the page registry
const router = createBrowserRouter(
  [
    {
      element: <PrivateRoute><PrivateLayout /></PrivateRoute>,
      children: [
        // Map admin routes
        ...Object.values(PAGE_REGISTRY.admin).map(page => ({
          path: page.urlPatterns[0],
          element: <page.component />,
        })),
      ],
    },
    {
      element: <PublicLayout />,
      children: [
        // Map general routes (like home)
        ...Object.values(PAGE_REGISTRY.general).map(page => ({
          path: page.urlPatterns[0],
          element: <page.component />,
        })),
        
        // Map district routes
        ...Object.values(PAGE_REGISTRY.district).map(page => ({
          path: page.urlPatterns[0],
          element: <page.component />,
        })),
        
        // Map school routes
        ...Object.values(PAGE_REGISTRY.school).map(page => ({
          path: page.urlPatterns[0],
          element: <page.component />,
        })),
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