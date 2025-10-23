
import React, { useState, ChangeEvent } from 'react';
import type { VocabularyItem } from '../types';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';

interface VocabularyManagerProps {
  vocabulary: VocabularyItem[];
  onUpdate: (item: VocabularyItem) => void;
  onDelete: (id: string) => void;
}

const VocabularyManager: React.FC<VocabularyManagerProps> = ({ vocabulary, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<VocabularyItem | null>(null);

  const handleEdit = (item: VocabularyItem) => {
    setEditingId(item.id);
    setEditedItem({ ...item });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedItem(null);
  };

  const handleSave = () => {
    if (editedItem) {
      onUpdate(editedItem);
    }
    handleCancel();
  };

  const handleDelete = (id: string, vietnamese: string) => {
    if (window.confirm(`Are you sure you want to delete "${vietnamese}"?`)) {
      onDelete(id);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (editedItem) {
      setEditedItem({ ...editedItem, [e.target.name]: e.target.value });
    }
  };

  const renderCell = (field: keyof VocabularyItem, item: VocabularyItem) => {
    if (editingId === item.id && editedItem) {
      return (
        <input
          type="text"
          name={field}
          value={editedItem[field]}
          onChange={handleInputChange}
          className="w-full bg-slate-50 border border-indigo-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      );
    }
    return item[field];
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-700 mb-6">Manage Vocabulary Collection</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100">
            <tr>
              <th scope="col" className="px-4 py-3">Vietnamese</th>
              <th scope="col" className="px-4 py-3">Chinese</th>
              <th scope="col" className="px-4 py-3">Pinyin</th>
              <th scope="col" className="px-4 py-3">Phonetic</th>
              <th scope="col" className="px-4 py-3">Hán Việt</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vocabulary.map((item) => (
              <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                <td className="px-4 py-3">{renderCell('vietnamese', item)}</td>
                <td className="px-4 py-3">{renderCell('chinese', item)}</td>
                <td className="px-4 py-3">{renderCell('pinyin', item)}</td>
                <td className="px-4 py-3">{renderCell('phonetic', item)}</td>
                <td className="px-4 py-3">{renderCell('hanViet', item)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center space-x-2">
                    {editingId === item.id ? (
                      <>
                        <button onClick={handleSave} className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100" title="Save">
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleCancel} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200" title="Cancel">
                          <XIcon className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100" title="Edit">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.vietnamese)} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100" title="Delete">
                          <DeleteIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VocabularyManager;
