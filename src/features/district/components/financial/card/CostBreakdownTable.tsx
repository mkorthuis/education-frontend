import React, { useState, useMemo } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  useMediaQuery, 
  useTheme,
  IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

// Interface for the table data structure
interface CostCategory {
  name: string;
  isSubcategory?: boolean;
  district: number; // Now represents percentage
  state: number; // Now represents percentage
  parent?: string; // Parent category name for subcategories
}

interface CostBreakdownTableProps {
  data?: CostCategory[];
  districtName?: string;
}

const CostBreakdownTable: React.FC<CostBreakdownTableProps> = ({ data, districtName = 'District' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };
  
  // Dummy data for demonstration - values are now percentages
  const dummyData: CostCategory[] = [
    { name: 'Instruction', district: 49.2, state: 48.3 },
    { name: 'Regular', isSubcategory: true, district: 33.5, state: 32.0 },
    { name: 'Special', isSubcategory: true, district: 9.8, state: 10.6 },
    { name: 'Vocational', isSubcategory: true, district: 3.9, state: 3.9 },
    { name: 'Other Programs', isSubcategory: true, district: 2.0, state: 1.8 },
    { name: 'Support Services', district: 38.4, state: 37.5 },
    { name: 'Student', isSubcategory: true, district: 8.2, state: 8.2 },
    { name: 'Building', isSubcategory: true, district: 9.0, state: 8.6 },
    { name: 'Administration', isSubcategory: true, district: 7.1, state: 6.5 },
    { name: 'Transportation', isSubcategory: true, district: 8.6, state: 9.3 },
    { name: 'Food', isSubcategory: true, district: 5.5, state: 4.9 },
    { name: 'Other', district: 12.4, state: 14.2 },
    { name: 'Facilities', isSubcategory: true, district: 7.1, state: 8.2 },
    { name: 'Debt Service', isSubcategory: true, district: 3.9, state: 4.9 },
    { name: 'Miscellaneous', isSubcategory: true, district: 1.4, state: 1.1 },
  ];

  const rawTableData = data || dummyData;
  
  // Process data to include parent information if not already included
  const processedData = useMemo(() => {
    let lastParent = '';
    return rawTableData.map(row => {
      if (!row.isSubcategory) {
        lastParent = row.name;
        return row;
      }
      return {
        ...row,
        parent: row.parent || lastParent
      };
    });
  }, [rawTableData]);
  
  // Filter data based on expanded categories
  const tableData = useMemo(() => {
    return processedData.filter(row => 
      !row.isSubcategory || // Always show main categories
      (row.parent && expandedCategories.includes(row.parent)) // Show subcategories only if parent is expanded
    );
  }, [processedData, expandedCategories]);
  
  // Find all unique parent categories
  const parentCategories = useMemo(() => {
    return [...new Set(processedData
      .filter(row => !row.isSubcategory)
      .map(row => row.name))];
  }, [processedData]);
  
  // Check if a category has subcategories
  const hasSubcategories = (categoryName: string) => {
    return processedData.some(row => row.isSubcategory && row.parent === categoryName);
  };

  // Format percentage with 1 decimal place and % sign
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: "center",
          width: "100%",
          mb: 1
        }}
      >
        Select Costs Relative to State Avg.
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            flex: 1,
            backgroundColor: 'grey.100',
            border: 1,
            borderColor: 'grey.300',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <Table size="small">
            <TableHead sx={{ 
              backgroundColor: 'grey.200',
              '& th': {
                borderBottom: '2px solid',
                borderColor: 'grey.400',
              }
            }}>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">District</TableCell>
                <TableCell align="right">State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    ...(row.isSubcategory && { 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }),
                    ...(!row.isSubcategory && {
                      '& td, & th': {
                        borderBottom: '2px solid',
                        borderColor: 'grey.300',
                      }
                    }),
                    ...(!row.isSubcategory && hasSubcategories(row.name) && {
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }
                    })
                  }}
                  onClick={() => !row.isSubcategory && hasSubcategories(row.name) && toggleCategory(row.name)}
                >
                  <TableCell 
                    component="th" 
                    scope="row"
                    sx={{ 
                      pl: row.isSubcategory ? 4 : 2,
                      fontWeight: 'normal',
                      fontStyle: row.isSubcategory ? 'italic' : 'normal',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {!row.isSubcategory && hasSubcategories(row.name) && (
                      <IconButton
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(row.name);
                        }}
                      >
                        {expandedCategories.includes(row.name) 
                          ? <KeyboardArrowDownIcon fontSize="small" />
                          : <KeyboardArrowRightIcon fontSize="small" />
                        }
                      </IconButton>
                    )}
                    {row.name}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      fontStyle: row.isSubcategory ? 'italic' : 'normal',
                    }}
                  >
                    {formatPercentage(row.district)}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      fontStyle: row.isSubcategory ? 'italic' : 'normal',
                    }}
                  >
                    {formatPercentage(row.state)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default CostBreakdownTable; 