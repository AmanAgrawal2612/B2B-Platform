import React, { useState } from 'react';
import { useShopNetwork } from '../hooks/useShopNetwork';
import ConnectShopForm from './features/network/ConnectShopForm';
import ConnectedShopsList from './features/network/ConnectedShopsList';

const CustomerNetworkManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { connections, isFetching, connectToShop, isConnecting } = useShopNetwork();

  const handleConnect = async (uniqueCode) => {
    await connectToShop(uniqueCode);
    setIsFormOpen(false); // Close form on success
  };

  return (
    <div className="space-y-6">
      {isFormOpen && (
        <div className="relative animate-fade-in">
          <button 
            onClick={() => setIsFormOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors z-10"
          >
            ✕
          </button>
          <ConnectShopForm onConnect={handleConnect} isLoading={isConnecting} />
        </div>
      )}
      <ConnectedShopsList 
        connections={connections} 
        isLoading={isFetching} 
        onAddNew={!isFormOpen ? () => setIsFormOpen(true) : null}
      />
    </div>
  );
};

export default CustomerNetworkManager;
