import React from 'react';
import { ShieldCheck, Target, Award, Brain, BarChart, FileCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AboutPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading">
          Empowering Every Aspirant to Excel in Government Exams
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          GovPrep is an independent digital learning and examination preparation platform built to provide students across India with realistic, accessible, and structured mock test series.
        </p>
      </div>

      {/* 1. What is GovPrep? */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">What is GovPrep?</h2>
        </div>
        <p className="text-base text-slate-600 leading-relaxed">
          GovPrep is an online government-exam preparation platform that bridges the gap between passive studying and high-pressure exam execution. Government recruitment examinations like Railway Recruitment Board (RRB NTPC, Group D, ALP, JE), Banking (IBPS PO), and State Public Service Commissions (APPSC) demand high speed, sharp accuracy, and disciplined time allocation.
        </p>
        <p className="text-base text-slate-600 leading-relaxed">
          Our platform equips students with real exam simulators, topic-wise practice modules, in-depth step-by-step explanations, and comprehensive data-driven diagnostic reports.
        </p>
      </section>

      {/* 2. Why GovPrep? */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Why GovPrep?</h2>
          <p className="text-base text-slate-500">Key pillars that make GovPrep stand out for serious aspirants.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Realistic Environment</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We replicate the exact question palettes, navigation systems, timer constraints, and negative marking formulas used in actual CBT exams.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Zero Guesswork Analysis</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of merely showing a final score, GovPrep identifies weak sub-topics like Profit & Loss or Syllogism so you know where to spend study hours.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Curated Question Bank</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every question comes with detailed rationale, algebraic shortcuts, and concept recaps prepared in alignment with recent official exam trends.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How Mock Tests Work (Light Mode) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6 shadow-xs">
        <div className="space-y-2">
          <Badge variant="blue" size="sm">Test Methodology</Badge>
          <h2 className="text-2xl font-bold font-heading text-slate-900">How Mock Tests Work</h2>
          <p className="text-sm text-slate-500">Step-by-step test execution lifecycle on GovPrep.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-blue-600 font-mono text-base">01. Setup</span>
            <h4 className="font-bold text-slate-900 text-base">Read Instructions</h4>
            <p className="text-slate-600 leading-relaxed text-sm">Confirm section weightage, negative marking rules, and keyboard shortcuts before beginning.</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-indigo-600 font-mono text-base">02. Attempt</span>
            <h4 className="font-bold text-slate-900 text-base">Live CBT Runner</h4>
            <p className="text-slate-600 leading-relaxed text-sm">Answer, mark for review, clear selections, and switch sections freely during the test.</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-amber-600 font-mono text-base">03. Verification</span>
            <h4 className="font-bold text-slate-900 text-base">Review Summary</h4>
            <p className="text-slate-600 leading-relaxed text-sm">Check answered vs unanswered count before confirming final test submission.</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-emerald-600 font-mono text-base">04. Scorecard</span>
            <h4 className="font-bold text-slate-900 text-base">Instant Diagnostics</h4>
            <p className="text-slate-600 leading-relaxed text-sm">Get accurate scores, percentiles, speed metrics, and recommended focus topics.</p>
          </div>
        </div>
      </section>

      {/* 4. Performance Analysis & AI-Assisted Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
            <BarChart className="h-5 w-5" />
            <span>Performance Analysis</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">In-Depth Diagnostic Feedback</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            GovPrep measures not just if you answered correctly, but how much time you spent per question. Our analytics engine flags time traps where you spent over 90 seconds, helping you avoid score leakages on exam day.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
            <FileCheck className="h-5 w-5" />
            <span>AI-Assisted Question Generation</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Adaptive Practice Variety</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our content framework generates variations of standard competitive exam problems across difficulty levels, ensuring students never run out of quality practice problems.
          </p>
        </div>
      </div>

      {/* 5. Our Approach */}
      <section className="bg-slate-100/70 p-8 rounded-2xl border border-slate-200 space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">Our Approach</h2>
        <p className="text-base text-slate-600 leading-relaxed">
          We believe consistency and iterative feedback form the core of exam success. By combining granular subject breakdown with user-friendly web interfaces, GovPrep makes high-quality exam preparation accessible to aspirants regardless of location or background.
        </p>
      </section>

      {/* 6. Disclaimer Section */}
      <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span>Educational Disclaimer</span>
        </div>
        <p className="text-sm text-amber-900 leading-relaxed font-semibold">
          GovPrep is an independent educational platform and is not an official government website.
        </p>
        <p className="text-sm text-amber-800 leading-relaxed">
          GovPrep is not affiliated with, authorized by, endorsed by, or in any way officially connected with the Railway Recruitment Board (RRB), Institute of Banking Personnel Selection (IBPS), Andhra Pradesh Public Service Commission (APPSC), or any other Central or State Government recruiting agency. All examination names, logos, syllabi, and trademarks are the property of their respective official organizations.
        </p>
      </section>
    </div>
  );
};
