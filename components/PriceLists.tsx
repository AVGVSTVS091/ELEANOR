import React, { useState, useRef, useCallback, DragEvent } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { usePriceLists } from '../hooks/usePriceLists';
import { parsePriceListFile } from '../utils/priceListParser';
import { PriceList, PriceListType, Product, CustomPriceList } from '../types';
import { UploadIcon, DocumentIcon, TrashIcon, ArrowPathIcon, EyeIcon, PlusCircleIcon } from './Icons';
import CloseButton from './CloseButton';

const ListPreviewModal: React.FC<{ list: CustomPriceList; onClose: () => void; }> = ({ list, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold">Vista Previa: {list.name}</h3>
                    <CloseButton onClose={onClose} />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-2">Código</th>
                                <th className="p-2">Producto</th>
                                <th className="p-2 text-right">Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.products.map(p => (
                                <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="p-2">{p.code}</td>
                                    <td className="p-2">{p.name}</td>
                                    <td className="p-2 text-right">${p.price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const AddListModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (name: string, products: Product[], fileName: string) => void; }> = ({ isOpen, onClose, onAdd }) => {
    const { t } = useTranslation();
    const [listName, setListName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file || !listName.trim()) {
            alert("Por favor, ingrese un nombre para la lista.");
            return;
        }
        setIsUploading(true);
        try {
            const products = await parsePriceListFile(file);
            onAdd(listName.trim(), products, file.name);
            setListName('');
        } catch (error) {
            console.error(error);
            alert(t('priceList.parseError'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFile(e.target.files[0]);
    };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold">Agregar Nueva Lista de Precios</h3>
                    <CloseButton onClose={onClose} />
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="listName" className="block text-sm font-medium mb-1">Nombre de la lista</label>
                        <input id="listName" type="text" value={listName} onChange={e => setListName(e.target.value)} placeholder="Ej: Lista Mayorista Especial" className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragOver ? 'border-green-500 bg-green-50 dark:bg-indigo-900/20' : ''}`}>
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                        ) : (
                            <>
                                <UploadIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Arrastre un archivo aquí o haga clic para seleccionar</p>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv, .txt" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


interface PriceListSlotProps {
  listType: PriceListType;
  list: PriceList | undefined;
  onUpload: (type: PriceListType, products: Product[], fileName: string) => void;
  onDelete: (type: PriceListType) => void;
}

const PriceListSlot: React.FC<PriceListSlotProps> = ({ listType, list, onUpload, onDelete }) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listTypeTranslations: Record<PriceListType, string> = {
    distributor: t('priceList.distributor'),
    consumer: t('priceList.consumer'),
    company: t('priceList.company'),
    cost: t('priceList.cost'),
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const products = await parsePriceListFile(file);
      onUpload(listType, products, file.name);
    } catch (error) {
      console.error(error);
      alert(t('priceList.parseError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">{listTypeTranslations[listType]}</h3>
      {list ? (
        <div>
          <div className="flex items-start p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
            <DocumentIcon className="w-6 h-6 text-green-500 dark:text-indigo-400 mt-1 flex-shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-all">{list.fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('priceList.uploadedOn')} {new Date(list.uploadDate).toLocaleDateString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{list.products.length} products</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3">
            <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-green-600 hover:text-green-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"><ArrowPathIcon className="w-4 h-4"/>{t('priceList.replace')}</button>
            <button onClick={() => onDelete(listType)} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"><TrashIcon className="w-4 h-4"/>{t('priceList.delete')}</button>
          </div>
        </div>
      ) : (
        <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className={`relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors ${isDragOver ? 'border-green-500 bg-green-50 dark:bg-indigo-900/20' : ''}`}
        >
          {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          ) : (
            <>
              <UploadIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
              <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-sm font-medium text-green-600 dark:text-indigo-400 hover:underline">
                {t('priceList.upload')}
              </button>
            </>
          )}
        </div>
      )}
       <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv, .txt" />
    </div>
  );
};

const PriceLists: React.FC = () => {
  const { priceLists, customLists, addOrUpdateList, deleteList, addCustomList, deleteCustomList } = usePriceLists();
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [listToPreview, setListToPreview] = useState<CustomPriceList | null>(null);

  const handleAddList = (name: string, products: Product[], fileName: string) => {
    addCustomList(name, products, fileName);
    setIsAddModalOpen(false);
  };
  
  const handleDeleteCustom = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta lista?')) {
        deleteCustomList(id);
    }
  }
  
  const listTypes: PriceListType[] = ['distributor', 'consumer', 'company', 'cost'];

  return (
    <div className="space-y-8">
        <div className="flex justify-end">
          <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
              <PlusCircleIcon className="w-5 h-5"/>
              Agregar lista
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {listTypes.map(type => (
          <PriceListSlot
            key={type}
            listType={type}
            list={priceLists.find(l => l.type === type)}
            onUpload={addOrUpdateList}
            onDelete={deleteList}
          />
        ))}
      </div>
      
      {customLists.length > 0 && (
          <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Otras listas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {customLists.map(list => (
                      <div key={list.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3 truncate" title={list.name}>{list.name}</h3>
                          <div className="flex items-start p-2 bg-gray-50 dark:bg-gray-700 rounded-md min-h-[76px]">
                              <DocumentIcon className="w-6 h-6 text-green-500 dark:text-indigo-400 mt-1 flex-shrink-0" />
                              <div className="ml-3 flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-all">{list.fileName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{list.products.length} productos</p>
                              </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-3">
                              <button onClick={() => setListToPreview(list)} className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"><EyeIcon className="w-4 h-4"/>{t('priceList.view')}</button>
                              <button onClick={() => handleDeleteCustom(list.id)} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"><TrashIcon className="w-4 h-4"/>{t('priceList.delete')}</button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <AddListModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddList} />
      {listToPreview && <ListPreviewModal list={listToPreview} onClose={() => setListToPreview(null)} />}
    </div>
  );
};

export default PriceLists;