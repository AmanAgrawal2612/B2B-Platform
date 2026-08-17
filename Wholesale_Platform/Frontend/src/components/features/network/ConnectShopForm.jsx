import React, { useState } from 'react';
import { Key, Plus } from 'lucide-react';
import Input from '../../common/Input';
import Button from '../../common/Button';

const ConnectShopForm = ({ onConnect, isLoading }) => {
  const [uniqueCode, setUniqueCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!uniqueCode) return;
    onConnect(uniqueCode);
    setUniqueCode('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <Key className="w-5 h-5 text-emerald-600" /> Connect to a New Shop
      </h2>
      <p className="text-slate-500 mb-4 text-sm">
        Enter the Unique Shop Code provided by your wholesaler to access their private inventory and place orders.
      </p>
      
      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1">
          <Input 
            placeholder="e.g. SHOP-3K6CDQE6Z" 
            value={uniqueCode}
            onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
            required 
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          <Plus className="w-5 h-5" /> Connect
        </Button>
      </form>
    </div>
  );
};

export default ConnectShopForm;
