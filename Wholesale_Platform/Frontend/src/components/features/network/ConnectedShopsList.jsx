import { Store, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const ConnectedShopsList = ({ connections, isLoading, isOrderMode = false, onAddNew }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-600" /> My Connected Shops
        </h2>
        {onAddNew && (
          <button 
            onClick={onAddNew}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm hover:shadow shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> New Shop
          </button>
        )}
      </div>
      
      {isLoading ? (
        <p className="text-slate-500 text-center py-4">Loading your shops...</p>
      ) : connections.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">You are not connected to any shops yet.</p>
          <p className="text-slate-400 text-sm mt-1">Use a shop code above to connect.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map(conn => {
            const content = (
              <div className={`border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between h-full ${
                isOrderMode 
                ? 'hover:shadow-lg hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 transition-all group cursor-pointer' 
                : 'hover:shadow-md transition-shadow'
              }`}>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {conn.Shop?.shopName?.charAt(0) || '?'}
                    </div>
                    <span className="truncate">{conn.Shop?.shopName || 'Unknown Shop'}</span>
                  </h3>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-slate-600"><span className="font-medium">Code:</span> {conn.Shop?.uniqueCode}</p>
                    <p className="text-sm text-slate-600"><span className="font-medium">City:</span> {conn.Shop?.city || 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                    Connected
                  </span>
                  {isOrderMode && (
                    <span className="text-emerald-600 font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Catalog <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            );

            if (isOrderMode) {
              return (
                <Link to={`/shop/${conn.Shop?.uniqueCode}`} key={conn.id} className="block h-full">
                  {content}
                </Link>
              );
            }

            return <div key={conn.id} className="block h-full">{content}</div>;
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectedShopsList;
