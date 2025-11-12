import React from 'react';
import { countries } from '../utils/countries';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({ value, onChange }) => {
  const selectedCountry = countries.find(c => c.code === value);

  return (
    <div className="relative flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md">
       <span className="pl-2 text-xl">{selectedCountry?.flag || '🌐'}</span>
      <input
        type="text"
        list="country-codes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-full w-24 bg-transparent py-2 pl-2 pr-1 text-gray-700 dark:text-gray-300 focus:outline-none sm:text-sm"
        placeholder="+54 9"
      />
      <datalist id="country-codes">
        {countries.map(country => (
          <option key={country.name} value={country.code}>
            {country.name}
          </option>
        ))}
      </datalist>
    </div>
  );
};
