import { useState, useEffect, useCallback } from 'react';
import { PriceList, PriceListType, Product, CustomPriceList } from '../types';

const STORAGE_KEY = 'crm_pricelists';
const CUSTOM_STORAGE_KEY = 'crm_custom_pricelists';

const getInitialPriceLists = (): PriceList[] => {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error reading price lists from localStorage', error);
    return [];
  }
};

const getInitialCustomPriceLists = (): CustomPriceList[] => {
  try {
    const item = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error reading custom price lists from localStorage', error);
    return [];
  }
};


export const usePriceLists = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>(getInitialPriceLists);
  const [customLists, setCustomLists] = useState<CustomPriceList[]>(getInitialCustomPriceLists);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(priceLists));
    } catch (error) {
      console.error('Error writing price lists to localStorage', error);
    }
  }, [priceLists]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customLists));
    } catch (error) {
      console.error('Error writing custom price lists to localStorage', error);
    }
  }, [customLists]);

  const addOrUpdateList = useCallback((type: PriceListType, products: Product[], fileName: string) => {
    const newList: PriceList = {
      type,
      products,
      fileName,
      uploadDate: new Date().toISOString(),
    };
    setPriceLists(prev => {
      const existing = prev.find(l => l.type === type);
      if (existing) {
        return prev.map(l => l.type === type ? newList : l);
      }
      return [...prev, newList];
    });
  }, []);
  
  const addCustomList = useCallback((name: string, products: Product[], fileName: string) => {
    const newList: CustomPriceList = {
      id: crypto.randomUUID(),
      name,
      products,
      fileName,
      uploadDate: new Date().toISOString(),
    };
    setCustomLists(prev => [...prev, newList]);
  }, []);

  const getListByType = useCallback((type: PriceListType): PriceList | undefined => {
      return priceLists.find(l => l.type === type);
  }, [priceLists]);

  const getCustomListById = useCallback((id: string): CustomPriceList | undefined => {
    return customLists.find(l => l.id === id);
  }, [customLists]);

  const deleteList = useCallback((type: PriceListType) => {
    setPriceLists(prev => prev.filter(l => l.type !== type));
  }, []);

  const deleteCustomList = useCallback((id: string) => {
    setCustomLists(prev => prev.filter(l => l.id !== id));
  }, []);

  return { priceLists, customLists, addOrUpdateList, getListByType, deleteList, addCustomList, deleteCustomList, getCustomListById };
};