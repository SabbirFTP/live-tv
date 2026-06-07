/**
 * Footer Component
 * Developer credits and information
 */

import React from 'react';

interface DeveloperInfo {
  name: string;
  github?: string;
  avatar?: string;
  description?: string;
}

interface FooterProps {
  developer: DeveloperInfo;
}

const Footer: React.FC<FooterProps> = ({ developer }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8 mt-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Developer Credit Section */}
        <div className="mb-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center gap-4">
            {developer.avatar && (
              <img
                src={developer.avatar}
                alt={developer.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
              />
            )}
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{developer.name}</h3>
              {developer.description && (
                <p className="text-slate-400 text-sm mt-1">{developer.description}</p>
              )}
              {developer.github && (
                <a
                  href={`https://github.com/${developer.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-flex items-center gap-1"
                >
                  GitHub: @{developer.github}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm">
          <p className="mb-2">
            🎬 Live TV - M3U/M3U8 Streaming Player
          </p>
          <p className="text-slate-500">
            Built with React + TypeScript + Tailwind CSS
          </p>
          <p className="text-xs text-slate-600 mt-3">
            © 2024 All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
