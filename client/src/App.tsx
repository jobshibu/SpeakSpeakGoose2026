/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './store';

// Screens
import AuthScreen from './screens/AuthScreen';
import PickPhraseScreen from './screens/PickPhraseScreen';
import HearItScreen from './screens/HearItScreen';
import RecordScreen from './screens/RecordScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import StatsScreen from './screens/StatsScreen';

// Components
import Nav from './components/Nav';

export default function App() {
  const token = useAppStore(state => state.token);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Routes>
          <Route 
            path="/" 
            element={token ? <Navigate to="/pick" /> : <AuthScreen />} 
          />
          <Route 
            path="/pick" 
            element={token ? <PickPhraseScreen /> : <Navigate to="/" />} 
          />
          <Route 
            path="/hear" 
            element={token ? <HearItScreen /> : <Navigate to="/" />} 
          />
          <Route 
            path="/record" 
            element={token ? <RecordScreen /> : <Navigate to="/" />} 
          />
          <Route 
            path="/feedback" 
            element={token ? <FeedbackScreen /> : <Navigate to="/" />} 
          />
          <Route 
            path="/stats" 
            element={token ? <StatsScreen /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

