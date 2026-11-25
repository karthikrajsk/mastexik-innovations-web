
import { useState, useEffect, useCallback, useRef } from 'react';
import { documentNumberService } from '@/services/DocumentNumberService';
import { toast } from 'react-toastify';

interface UseDocumentNumberOptions {
  screenName: string;
  tabName?: string | number;
  existingNumber?: string;
  shouldGenerateOnMount?: boolean;
  onNumberGenerated?: (number: string) => void;
  loadingPlaceholder?: string;
}

interface UseDocumentNumberReturn {
  documentNumber: string;
  isGenerating: boolean;
  generateDocumentNumber: () => Promise<string | null>;
  commitDocumentNumber: (overrideNumber?: string) => Promise<void>;
  clearDocumentNumber: () => void;
  overrideDocumentNumber: (value: string) => void;
  isCommitted: boolean;
}

export const useDocumentNumber = ({
  screenName,
  tabName,
  existingNumber,
  shouldGenerateOnMount = true,
  onNumberGenerated,
  loadingPlaceholder = 'Loading sequence...'
}: UseDocumentNumberOptions): UseDocumentNumberReturn => {
  const [documentNumber, setDocumentNumber] = useState<string>(
    existingNumber || (shouldGenerateOnMount ? loadingPlaceholder : '')
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const generatedNumberRef = useRef<string | null>(null);
  const isMounted = useRef(true);

  // Prevent duplicate generation
  const generationLock = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      if (existingNumber) {
        setDocumentNumber(existingNumber);
        setIsCommitted(true);
      } else if (shouldGenerateOnMount && !generationLock.current) {
        setDocumentNumber(loadingPlaceholder);
        await generateDocumentNumber();
      }
    };

    initialize();
  }, []);

  const generateDocumentNumber = useCallback(async (): Promise<string | null> => {
    if (generationLock.current) {
      console.warn(`[useDocumentNumber] Generation already in progress for ${screenName}`);
      return null;
    }

    // Don't generate if we already have a committed number
    if (isCommitted && documentNumber) {
      return documentNumber;
    }

    generationLock.current = true;
    setIsGenerating(true);

    try {
      console.log(`[useDocumentNumber] Generating document number for: ${screenName}, tab: ${tabName}`);

      const result = await documentNumberService.generateDocumentNumber({
        screenName,
        tabName
      });

      if (!isMounted.current) {
        generationLock.current = false;
        return null;
      }

      const newNumber = result.documentNumber || '';
      
      // Store in ref to prevent re-generation on re-renders
      generatedNumberRef.current = newNumber;
      setDocumentNumber(newNumber);
      
      if (onNumberGenerated) {
        onNumberGenerated(newNumber);
      }

      console.log(`[useDocumentNumber] Generated number: ${newNumber}`);
      return newNumber;
    } catch (error) {
      console.error(`[useDocumentNumber] Failed to generate document number for ${screenName}:`, error);
      
      if (isMounted.current) {
        toast.error(`Failed to generate ${screenName} number`);
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsGenerating(false);
      }
      // Use setTimeout to ensure lock is released after current execution
      setTimeout(() => {
        generationLock.current = false;
      }, 100);
    }
  }, [screenName, tabName, documentNumber, isCommitted, onNumberGenerated]);

  const commitDocumentNumber = useCallback(async (overrideNumber?: string): Promise<void> => {
    const numberToCommit = overrideNumber || documentNumber;
    if (!numberToCommit || isCommitted) {
      return;
    }

    try {
      // await documentNumberService.commitDocumentNumber(screenName, numberToCommit, tabName);
      setIsCommitted(true);
      console.log(`[useDocumentNumber] Committed document number: ${numberToCommit}`);
    } catch (error) {
      console.error(`[useDocumentNumber] Failed to commit document number ${numberToCommit}:`, error);
      // Don't toast here to avoid interrupting save flow
    }
  }, [documentNumber, screenName, tabName, isCommitted]);

  const overrideDocumentNumber = useCallback((value: string) => {
    setDocumentNumber(value);
    generatedNumberRef.current = value;
    setIsCommitted(false);
  }, []);

  const clearDocumentNumber = useCallback(() => {
    setDocumentNumber('');
    generatedNumberRef.current = null;
    setIsCommitted(false);
    generationLock.current = false;
  }, []);

  return {
    documentNumber,
    isGenerating,
    generateDocumentNumber,
    commitDocumentNumber,
    clearDocumentNumber,
    overrideDocumentNumber,
    isCommitted
  };
};