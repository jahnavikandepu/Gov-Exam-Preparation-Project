import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const HomePage = () => {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 py-20 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Prepare Smarter. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
                Practice Better.
              </span> <br />
              Perform with Confidence.
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              GovPrep helps students prepare for government exams through realistic mock tests, performance analysis and targeted practice.
            </p>

            <div className="flex items-center justify-center pt-2">
              <Link to="/exams">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Explore Exams
                </Button>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-xl mx-auto text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">100%</p>
                <p className="text-xs text-slate-500 font-medium">Real Exam Interface</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">50,000+</p>
                <p className="text-xs text-slate-500 font-medium">Questions Bank</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">0.33</p>
                <p className="text-xs text-slate-500 font-medium">Accurate Negative Marking</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
