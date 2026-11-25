// components/DocumentNumberWrapper.tsx
import { useDocumentNumber } from '@/hooks/UseDocumentNumberReturn';
import React, { ComponentType } from 'react';

interface WithDocumentNumberProps {
  screenName: string;
  tabName?: string | number;
  existingNumber?: string;
  fieldName?: string;
}

export function withDocumentNumber<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithDocumentNumberProps
) {
  return function WithDocumentNumber(props: P) {
    const {
      documentNumber,
      isGenerating,
      generateDocumentNumber,
      commitDocumentNumber,
      clearDocumentNumber,
      isCommitted
    } = useDocumentNumber({
      screenName: options.screenName,
      tabName: options.tabName,
      existingNumber: options.existingNumber,
      shouldGenerateOnMount: true
    });

    // Pass document number utilities as props
    const enhancedProps = {
      ...props,
      [options.fieldName || 'documentNumber']: documentNumber,
      isGeneratingDocumentNumber: isGenerating,
      generateDocumentNumber,
      commitDocumentNumber,
      clearDocumentNumber,
      isDocumentNumberCommitted: isCommitted
    } as P;

    return <WrappedComponent {...enhancedProps} />;
  };
}