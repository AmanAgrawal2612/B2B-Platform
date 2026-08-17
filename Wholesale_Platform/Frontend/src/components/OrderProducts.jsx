import React from 'react';
import { useShopNetwork } from '../hooks/useShopNetwork';
import ConnectedShopsList from './features/network/ConnectedShopsList';

const OrderProducts = () => {
  const { connections, isFetching } = useShopNetwork();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Order Products</h1>
        <p className="text-slate-500">Select a supplier below to view their catalog and place wholesale orders.</p>
      </div>
      <ConnectedShopsList connections={connections} isLoading={isFetching} isOrderMode={true} />
    </div>
  );
};

export default OrderProducts;
