import React from 'react';
import { BibleNavigation } from './components/BibleNavigation';
import { BibleReader } from './components/BibleReader';
import { Sidebar } from './components/Sidebar';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-700 text-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Bible Explorer</h1>
        </div>
      </header>
      
      <BibleNavigation />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <BibleReader />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;