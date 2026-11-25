// src/hooks/useUrlParams.ts
import { useSearchParams } from 'react-router-dom';

export interface UrlParamsData {
  parentId: string | null;
  parentName: string | null;
  childId: string | null;
  childName: string | null;
}

/**
 * Custom hook to get parent/child parameters from URL
 */
export const useUrlParams = (): UrlParamsData => {
  const [searchParams] = useSearchParams();
  
  return {
    parentId: searchParams.get('parentId'),
    parentName: searchParams.get('parentName'),
    childId: searchParams.get('childId'),
    childName: searchParams.get('childName'),
  };
};

// src/utils/navigation.ts
import { NavigateOptions } from 'react-router-dom';

export interface NavigationParams {
  parentId?: string | number;
  parentName?: string;
  childId?: string | number;
  childName?: string;
}

/**
 * Build URL with parent/child parameters
 */
export const buildUrlWithParams = (
  basePath: string,
  params?: NavigationParams
): string => {
  if (!params) return basePath;

  const queryParams = new URLSearchParams();
  
  if (params.parentId !== undefined) {
    queryParams.append('parentId', String(params.parentId));
  }
  
  if (params.parentName) {
    queryParams.append('parentName', params.parentName);
  }
  
  if (params.childId !== undefined) {
    queryParams.append('childId', String(params.childId));
  }
  
  if (params.childName) {
    queryParams.append('childName', params.childName);
  }

  const queryString = queryParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

/**
 * Navigate with parent/child parameters
 * Usage with useNavigate hook
 */
export const navigateWithParams = (
  navigate: (to: string, options?: NavigateOptions) => void,
  path: string,
  params?: NavigationParams,
  options?: NavigateOptions
): void => {
  const fullPath = buildUrlWithParams(path, params);
  navigate(fullPath, options);
};

// Example usage in components:
/*
import { useNavigate } from 'react-router-dom';
import { navigateWithParams } from '@/utils/navigation';
import { useUrlParams } from '@/hooks/useUrlParams';

function MyComponent() {
  const navigate = useNavigate();
  const { parentId, parentName, childId, childName } = useUrlParams();
  
  // Read params
  useEffect(() => {
    if (parentId) {
      console.log('Parent ID:', parentId, 'Name:', parentName);
    }
    if (childId) {
      console.log('Child ID:', childId, 'Name:', childName);
    }
  }, [parentId, parentName, childId, childName]);
  
  // Navigate with params
  const handleNavigate = () => {
    navigateWithParams(
      navigate,
      '/masters/sub-category',
      {
        parentId: 1,
        parentName: 'Main Category',
        childId: 10,
        childName: 'Sub Category'
      }
    );
  };
  
  return <button onClick={handleNavigate}>Navigate</button>;
}
*/