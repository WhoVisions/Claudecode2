'use client';

import React, { useState, useEffect } from 'react';
import { db, ClientOrganizerAnswer } from '@/app/lib/db';
import { FaClipboardList, FaCheckCircle, FaTimesCircle, FaUsers, FaHome, FaBriefcase, FaChartLine, FaStore, FaGraduationCap, FaHeart } from 'react-icons/fa';

interface OrganizerQuestion {
  id: string;
  question: string;
  category: ClientOrganizerAnswer['category'];
  tooltip?: string;
}

const ORGANIZER_QUESTIONS: OrganizerQuestion[] = [
  // Family & Dependents
  { id: 'married', question: 'Did you get married this year?', category: 'family', tooltip: 'May affect filing status and deductions' },
  { id: 'divorced', question: 'Did you get divorced or legally separated?', category: 'family', tooltip: 'Changes filing status' },
  { id: 'child-born', question: 'Did you have or adopt a child?', category: 'family', tooltip: 'New dependent and child tax credit' },
  { id: 'dependent-added', question: 'Did you add any other dependents?', category: 'family', tooltip: 'May qualify for additional credits' },
  { id: 'dependent-removed', question: 'Did any dependents turn 17 or become independent?', category: 'family', tooltip: 'May lose child tax credit' },
  { id: 'child-support', question: 'Did you pay or receive child support or alimony?', category: 'family' },

  // Housing
  { id: 'home-purchased', question: 'Did you purchase a primary residence?', category: 'housing', tooltip: 'May qualify for mortgage interest deduction' },
  { id: 'home-sold', question: 'Did you sell your primary residence?', category: 'housing', tooltip: 'May need to report capital gains' },
  { id: 'home-refinanced', question: 'Did you refinance your mortgage?', category: 'housing', tooltip: 'Changes mortgage interest deduction' },
  { id: 'rental-property', question: 'Did you purchase or sell a rental property?', category: 'housing', tooltip: 'Requires Schedule E' },
  { id: 'moved-state', question: 'Did you move to a different state?', category: 'housing', tooltip: 'May affect state tax filing' },
  { id: 'home-office', question: 'Did you use part of your home for business?', category: 'housing', tooltip: 'Home office deduction' },

  // Employment
  { id: 'job-changed', question: 'Did you change jobs?', category: 'employment', tooltip: 'Multiple W-2s' },
  { id: 'job-lost', question: 'Did you lose your job or receive severance?', category: 'employment', tooltip: 'Severance is taxable income' },
  { id: 'unemployment', question: 'Did you receive unemployment benefits?', category: 'employment', tooltip: 'Unemployment is taxable' },
  { id: 'retirement-contributions', question: 'Did you contribute to a 401(k) or IRA?', category: 'employment', tooltip: 'May be tax deductible' },
  { id: 'early-retirement', question: 'Did you retire or take early retirement?', category: 'employment', tooltip: 'May have pension or 401(k) distributions' },

  // Investments
  { id: 'stocks-sold', question: 'Did you sell any stocks, bonds, or cryptocurrency?', category: 'investment', tooltip: 'Requires reporting capital gains/losses' },
  { id: 'dividends-received', question: 'Did you receive dividends or interest income?', category: 'investment', tooltip: 'Taxable income (1099-DIV, 1099-INT)' },
  { id: 'crypto-transactions', question: 'Did you buy, sell, or trade cryptocurrency?', category: 'investment', tooltip: 'All crypto transactions must be reported' },
  { id: 'investment-income', question: 'Did you have investment income over $10,000?', category: 'investment', tooltip: 'May affect deductions and AMT' },

  // Business
  { id: 'business-started', question: 'Did you start a business or become self-employed?', category: 'business', tooltip: 'Requires Schedule C' },
  { id: 'business-closed', question: 'Did you close a business?', category: 'business', tooltip: 'May have final tax obligations' },
  { id: 'contractor-income', question: 'Did you work as an independent contractor or freelancer?', category: 'business', tooltip: 'Requires 1099-NEC and Schedule C' },
  { id: 'business-expenses', question: 'Did you have significant business expenses?', category: 'business', tooltip: 'Deductible on Schedule C' },

  // Education
  { id: 'tuition-paid', question: 'Did you pay tuition for yourself or a dependent?', category: 'education', tooltip: 'May qualify for education credits' },
  { id: 'student-loan-interest', question: 'Did you pay student loan interest?', category: 'education', tooltip: 'May be deductible up to $2,500' },
  { id: 'scholarships', question: 'Did you or a dependent receive a scholarship or grant?', category: 'education', tooltip: 'May be taxable if used for non-qualified expenses' },

  // Health
  { id: 'medical-expenses-high', question: 'Did you have medical expenses over $5,000?', category: 'health', tooltip: 'May exceed 7.5% AGI threshold for deduction' },
  { id: 'health-insurance-marketplace', question: 'Did you purchase health insurance through the marketplace?', category: 'health', tooltip: 'May qualify for premium tax credit' },
  { id: 'hsa-contributions', question: 'Did you contribute to an HSA?', category: 'health', tooltip: 'Tax deductible' },
  { id: 'disability-income', question: 'Did you receive disability income?', category: 'health', tooltip: 'May be taxable depending on who paid the premiums' },

  // Other
  { id: 'charitable-donations', question: 'Did you make charitable donations over $250?', category: 'other', tooltip: 'Requires written acknowledgment from charity' },
  { id: 'gambling-winnings', question: 'Did you have gambling winnings or losses?', category: 'other', tooltip: 'Winnings are taxable, losses may be deductible' },
  { id: 'foreign-income', question: 'Did you have foreign income or foreign bank accounts?', category: 'other', tooltip: 'May require FBAR or FATCA reporting' },
  { id: 'inheritance', question: 'Did you receive an inheritance or gift over $15,000?', category: 'other', tooltip: 'May require gift tax return' },
];

const ClientOrganizerApp: React.FC = () => {
  const [taxYear] = useState(2024);
  const [answers, setAnswers] = useState<Map<string, ClientOrganizerAnswer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ClientOrganizerAnswer['category'] | 'all'>('all');

  useEffect(() => {
    loadAnswers();
  }, []);

  const loadAnswers = async () => {
    try {
      const keys = await db.clientOrganizer.keys();
      const answersMap = new Map<string, ClientOrganizerAnswer>();

      for (const key of keys) {
        const answer = await db.clientOrganizer.getItem<ClientOrganizerAnswer>(key);
        if (answer && answer.taxYear === taxYear) {
          answersMap.set(answer.id, answer);
        }
      }

      setAnswers(answersMap);
    } catch (error) {
      console.error('Error loading organizer answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string, question: string, category: ClientOrganizerAnswer['category'], answer: boolean) => {
    const organizerAnswer: ClientOrganizerAnswer = {
      id: questionId,
      taxYear,
      question,
      answer,
      category,
      updatedAt: new Date().toISOString(),
    };

    await db.clientOrganizer.setItem(questionId, organizerAnswer);

    const newAnswers = new Map(answers);
    newAnswers.set(questionId, organizerAnswer);
    setAnswers(newAnswers);
  };

  const getCategoryIcon = (category: ClientOrganizerAnswer['category']) => {
    switch (category) {
      case 'family': return FaUsers;
      case 'housing': return FaHome;
      case 'employment': return FaBriefcase;
      case 'investment': return FaChartLine;
      case 'business': return FaStore;
      case 'education': return FaGraduationCap;
      case 'health': return FaHeart;
      default: return FaClipboardList;
    }
  };

  const getCategoryName = (category: ClientOrganizerAnswer['category']) => {
    switch (category) {
      case 'family': return 'Family & Dependents';
      case 'housing': return 'Housing & Real Estate';
      case 'employment': return 'Employment & Retirement';
      case 'investment': return 'Investments';
      case 'business': return 'Business & Self-Employment';
      case 'education': return 'Education';
      case 'health': return 'Health & Insurance';
      default: return 'Other';
    }
  };

  const filteredQuestions = ORGANIZER_QUESTIONS.filter(q =>
    filter === 'all' || q.category === filter
  );

  const yesCount = Array.from(answers.values()).filter(a => a.answer === true).length;
  const noCount = Array.from(answers.values()).filter(a => a.answer === false).length;
  const totalCount = ORGANIZER_QUESTIONS.length;
  const answeredCount = yesCount + noCount;
  const completionPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  const categories: ClientOrganizerAnswer['category'][] = ['family', 'housing', 'employment', 'investment', 'business', 'education', 'health', 'other'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Loading organizer...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <FaClipboardList className="text-blue-400 text-2xl" />
          <div>
            <h2 className="text-2xl font-bold text-gray-200">Client Tax Organizer</h2>
            <p className="text-sm text-gray-400">Tax Year {taxYear}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Questions Answered</span>
            <span>{answeredCount} / {totalCount} ({completionPercent.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                completionPercent === 100
                  ? 'bg-green-500'
                  : completionPercent >= 50
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-400" />
              <span className="text-gray-300">{yesCount} Yes</span>
            </div>
            <div className="flex items-center gap-2">
              <FaTimesCircle className="text-red-400" />
              <span className="text-gray-300">{noCount} No</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClipboardList className="text-gray-500" />
              <span className="text-gray-400">{totalCount - answeredCount} Unanswered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Icon className="text-xs" />
                {getCategoryName(category)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {filteredQuestions.map((q) => {
            const answer = answers.get(q.id);
            const Icon = getCategoryIcon(q.category);

            return (
              <div
                key={q.id}
                className={`bg-gray-800 rounded-lg p-4 border transition-all ${
                  answer
                    ? answer.answer
                      ? 'border-green-700 bg-green-900/10'
                      : 'border-red-700 bg-red-900/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="text-gray-500 text-sm" />
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                        {getCategoryName(q.category)}
                      </span>
                    </div>
                    <h4 className="text-base font-medium text-gray-200 mb-1">
                      {q.question}
                    </h4>
                    {q.tooltip && (
                      <p className="text-xs text-gray-500">{q.tooltip}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnswer(q.id, q.question, q.category, true)}
                      className={`px-4 py-2 rounded transition-all ${
                        answer?.answer === true
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-green-600/20 hover:border-green-600 border border-transparent'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswer(q.id, q.question, q.category, false)}
                      className={`px-4 py-2 rounded transition-all ${
                        answer?.answer === false
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-red-600/20 hover:border-red-600 border border-transparent'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Footer */}
      {completionPercent === 100 && (
        <div className="bg-green-900/20 border-t border-green-700 px-6 py-3">
          <div className="flex items-center gap-2 text-green-400">
            <FaCheckCircle />
            <p className="text-sm">
              Organizer complete! The Local Audit Center will now cross-reference your answers with your tax data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrganizerApp;
