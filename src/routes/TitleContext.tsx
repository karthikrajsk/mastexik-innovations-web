import React, { createContext, useContext, useMemo } from 'react';
import { matchPath } from 'react-router-dom';

export interface RouteTitleItem {
  pattern: string;
  title: string;
  hideTitle?: boolean;
}

interface TitleContextType {
  titleMap: RouteTitleItem[];
}

export const TitleContext = createContext<TitleContextType>({
  titleMap: [],
});

function cleanParentPath(parent: string): string {
  if (parent.endsWith('/*')) {
    return parent.slice(0, -2);
  }
  if (parent.endsWith('*')) {
    return parent.slice(0, -1);
  }
  return parent;
}

function formatSegment(segment: string): string {
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPathToTitle(path: string): string {
  if (!path || path === '*' || path === '/*' || path.endsWith('/*') || path.endsWith('*')) return '';
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  if (lastSegment === '*' || (lastSegment.startsWith(':') && segments.length === 1)) return '';
  if (lastSegment.startsWith(':') && segments.length > 1) {
    return formatSegment(segments[segments.length - 2]);
  }
  return formatSegment(lastSegment);
}

export function buildRouteMap(children: React.ReactNode, parentPath = ''): RouteTitleItem[] {
  const items: RouteTitleItem[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const props = child.props as any;
    let currentPath = props.path || '';

    if (props.index) {
      currentPath = '';
    }

    const cleanParent = cleanParentPath(parentPath);
    let resolvedPath = '';

    if (currentPath.startsWith('/')) {
      resolvedPath = currentPath;
    } else {
      resolvedPath = [cleanParent, currentPath].filter(Boolean).join('/');
      if (!resolvedPath.startsWith('/')) {
        resolvedPath = '/' + resolvedPath;
      }
    }

    resolvedPath = resolvedPath.replace(/\/+/g, '/');

    // Get title if defined, or infer it from the path
    let title = props.title;
    if (!title && currentPath) {
      title = formatPathToTitle(currentPath);
    }

    if (title) {
      items.push({
        pattern: resolvedPath,
        title: title,
        hideTitle: !!props.hideTitle,
      });
    }

    if (props.children) {
      items.push(...buildRouteMap(props.children, resolvedPath));
    }
  });

  return items;
}

export function useRouteTitle(pathname: string, titleMap: RouteTitleItem[]) {
  return useMemo(() => {
    for (const item of titleMap) {
      const match = matchPath({ path: item.pattern, end: true }, pathname);
      if (match) {
        if (item.pattern.includes(':reportSlug') && match.params.reportSlug) {
          const slug = match.params.reportSlug;
          const cleanSlug = slug.replace(/-\d+$/, '');
          const dynamicTitle = cleanSlug
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
          return {
            title: dynamicTitle,
            hideTitle: !!item.hideTitle,
          };
        }
        return {
          title: item.title,
          hideTitle: !!item.hideTitle,
        };
      }
    }
    return { title: '', hideTitle: false };
  }, [pathname, titleMap]);
}
