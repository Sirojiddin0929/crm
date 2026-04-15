import React from 'react';
import { ShoppingBag } from 'lucide-react';

const products = [
  { id: 1, name: "Kurs daftari", price: 45, stock: 8 },
  { id: 2, name: "Brend ruchka", price: 15, stock: 24 },
  { id: 3, name: "Suv idishi", price: 70, stock: 5 },
];

export default function StudentShop() {
  return (
    <div className="fade-in space-y-4">
      <h1 className="text-2xl font-900 text-gray-800">Do'kon</h1>
      <p className="text-sm font-700 text-gray-500">Coinlaringizni foydali sovg'alarga almashtiring.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map(item => (
          <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag size={20} />
            </div>
            <p className="text-base font-900 text-gray-800">{item.name}</p>
            <p className="mt-1 text-sm font-700 text-gray-500">Qoldiq: {item.stock} dona</p>
            <p className="mt-3 text-sm font-900 text-emerald-600">{item.price} coin</p>
            <button className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-900 uppercase tracking-wider text-white transition hover:bg-emerald-600">
              Xarid qilish
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
