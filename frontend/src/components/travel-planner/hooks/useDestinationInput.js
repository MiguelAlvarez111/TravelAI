/**
 * useDestinationInput.js - Hook personalizado para manejo de input de destino
 */

import { useRef, useCallback } from 'react';

export const useDestinationInput = (setFormData, triggerSearch, setShowDestinationSuggestions) => {
  const destinationInputRef = useRef(null);
  const destinationValueRef = useRef('');

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'destination') {
      setFormData(prev => ({
        ...prev,
        destination: value
      }));
      
      destinationValueRef.current = value;
      triggerSearch(value);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, [setFormData, triggerSearch]);
  
  const handleDestinationSelect = useCallback((suggestion) => {
    const formattedName = suggestion.display_name;
    
    if (destinationInputRef.current) {
      destinationInputRef.current.value = formattedName;
    }
    destinationValueRef.current = formattedName;
    
    setFormData(prev => ({
      ...prev,
      destination: formattedName
    }));
    
    setShowDestinationSuggestions(false);
    
    if (destinationInputRef.current) {
      destinationInputRef.current.focus();
    }
  }, [setFormData, setShowDestinationSuggestions]);

  const handleDestinationBlur = useCallback(() => {
    setTimeout(() => {
      if (destinationInputRef.current) {
        const value = destinationInputRef.current.value;
        destinationValueRef.current = value;
        setFormData(prev => ({
          ...prev,
          destination: value
        }));
      }
      setShowDestinationSuggestions(false);
    }, 200);
  }, [setFormData, setShowDestinationSuggestions]);

  return {
    destinationInputRef,
    destinationValueRef,
    handleInputChange,
    handleDestinationSelect,
    handleDestinationBlur
  };
};

