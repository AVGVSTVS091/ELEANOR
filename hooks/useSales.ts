
import { useState, useEffect, useCallback } from 'react';
import { Sale } from '../types';

const STORAGE_KEY = 'crm_sales';

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error('Error reading sales from localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    } catch (error) {
      console.error('Error writing sales to localStorage', error);
    }
  }, [sales]);

  const addSale = useCallback((saleData: Omit<Sale, 'id' | 'timestamp'>) => {
    const newSale: Sale = {
      ...saleData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setSales(prev => [...prev, newSale]);
    
    // Analytics
    console.log('Analytics: sale_registered', { 
        amount: newSale.amount, 
        date: newSale.date, 
        originId: newSale.originId 
    });
    
    return newSale;
  }, []);

  return { sales, addSale };
};
