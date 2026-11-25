import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Maps an icon name string to a LucideIcon component.
 * Fallbacks to 'Circle' if not found.
 */
export const getIconByName = (name: string): LucideIcon => {
  // Convert kebab-case or snake_case to PascalCase if necessary
  const pascalName = name
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // @ts-expect-error - dynamic icon access
  const Icon = LucideIcons[pascalName] || LucideIcons[name] || LucideIcons.Circle;
  return Icon as LucideIcon;
};
