import documentNumberService from '@/services/DocumentNumberService';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

interface UseAutoDocumentNumberProps {
  screenName: string;
  tabName?: string | number;
  detail?: { id?: number };
  existingValue?: string;
  fieldName?: string;
  setValue?: (name: any, value?: any, options?: any) => void;
  onValueChange?: (value: string) => void;
  isSavingRef?: MutableRefObject<boolean>;
  loadingPlaceholder?: string;
}

export const useAutoDocumentNumber = ({
  screenName,
  tabName,
  detail,
  existingValue,
  fieldName,
  setValue,
  onValueChange,
  isSavingRef,
  loadingPlaceholder = 'Loading sequence...',
}: UseAutoDocumentNumberProps) => {
  const hasGeneratedNumberRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const detailId = detail?.id;
    const hasExistingValue = Boolean(existingValue && existingValue !== loadingPlaceholder);
    const canAssignViaSetValue = Boolean(setValue && fieldName);
    const canAssignViaCallback = Boolean(onValueChange);

    if (!canAssignViaSetValue && !canAssignViaCallback) {
      return;
    }

    if (detailId || hasExistingValue) {
      hasGeneratedNumberRef.current = true;
      return;
    }

    const assignGeneratedNumber = (generatedNumber: string) => {
      if (canAssignViaSetValue && setValue && fieldName) {
        setValue(fieldName, generatedNumber, {
          shouldValidate: true,
        });
      }

      if (canAssignViaCallback && onValueChange) {
        onValueChange(generatedNumber);
      }
    };

    const generateNumber = async () => {
      if (hasGeneratedNumberRef.current) {
        return;
      }

      hasGeneratedNumberRef.current = true;
      setIsGenerating(true);

      // Immediately display loading placeholder in the form input field
      assignGeneratedNumber(loadingPlaceholder);

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName,
          tabName,
        });

        assignGeneratedNumber(result.documentNumber);
      } catch (error) {
        console.warn(`Failed to generate number for ${screenName}:`, error);
        hasGeneratedNumberRef.current = false;
        assignGeneratedNumber('');
      } finally {
        setIsGenerating(false);
      }
    };

    generateNumber();
  }, [screenName, tabName, detail?.id, existingValue, fieldName, setValue, onValueChange, loadingPlaceholder]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!detail?.id && hasGeneratedNumberRef.current && !isSavingRef?.current) {
        documentNumberService.clearMemoryCache(screenName, tabName);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!detail?.id && hasGeneratedNumberRef.current && !isSavingRef?.current) {
        documentNumberService.clearMemoryCache(screenName, tabName);
      }
    };
  }, [screenName, tabName, detail?.id, isSavingRef]);

  return { isGenerating };
};