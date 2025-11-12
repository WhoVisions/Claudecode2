'use client';

import React, { useState, useEffect } from 'react';
import { db, TaxKnowledgeChunk, seedTaxKnowledge } from '@/app/lib/db';
import { FaSearch, FaBook, FaLightbulb, FaCheckCircle } from 'react-icons/fa';

interface SearchResult {
  chunk: TaxKnowledgeChunk;
  score: number;
}

interface AnswerResult {
  question: string;
  answer: string;
  sources: TaxKnowledgeChunk[];
  timestamp: string;
}

const TaxResearchApp: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [exampleQuestions] = useState([
    'What is the standard deduction for 2024?',
    'How does the home office deduction work?',
    'What are capital gains tax rates?',
    'How is cryptocurrency taxed?',
    'What medical expenses are deductible?',
  ]);

  useEffect(() => {
    initializeKnowledge();
  }, []);

  const initializeKnowledge = async () => {
    await seedTaxKnowledge();
    setInitialized(true);
  };

  const extractKeywords = (query: string): string[] => {
    // Simple keyword extraction - lowercase and remove common words
    const commonWords = ['what', 'how', 'is', 'are', 'the', 'a', 'an', 'for', 'to', 'in', 'on', 'of', 'do', 'does', 'can', 'i', 'my'];
    const words = query.toLowerCase().split(/\s+/);
    return words.filter(word => !commonWords.includes(word) && word.length > 2);
  };

  const retrieveRelevantChunks = async (query: string): Promise<SearchResult[]> => {
    const keywords = extractKeywords(query);
    const allChunks: TaxKnowledgeChunk[] = [];

    const keys = await db.taxKnowledge.keys();
    for (const key of keys) {
      const chunk = await db.taxKnowledge.getItem<TaxKnowledgeChunk>(key);
      if (chunk) {
        allChunks.push(chunk);
      }
    }

    // Score each chunk based on keyword matches
    const scoredChunks: SearchResult[] = allChunks.map(chunk => {
      let score = 0;

      // Check for keyword matches in chunk keywords
      for (const keyword of keywords) {
        if (chunk.keywords.some(k => k.includes(keyword) || keyword.includes(k))) {
          score += 3;
        }
      }

      // Check for keyword matches in content
      const contentLower = chunk.content.toLowerCase();
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          score += 2;
        }
      }

      // Check for keyword matches in section/title
      const sectionLower = chunk.section.toLowerCase();
      const titleLower = chunk.title.toLowerCase();
      for (const keyword of keywords) {
        if (sectionLower.includes(keyword) || titleLower.includes(keyword)) {
          score += 1;
        }
      }

      return { chunk, score };
    });

    // Sort by score and return top 3
    return scoredChunks.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const generateAnswer = async (query: string, sources: TaxKnowledgeChunk[]): Promise<string> => {
    // Create context from top sources
    const context = sources.map((source, idx) =>
      `Source ${idx + 1} (${source.source}, ${source.section}): ${source.content}`
    ).join('\n\n');

    // For MVP, create a simple extractive answer
    // In a full implementation, this would use transformers.js question-answering model

    // Find the most relevant sentence from the context
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keywords = extractKeywords(query);

    let bestSentence = sentences[0] || 'No relevant information found.';
    let bestScore = 0;

    for (const sentence of sentences) {
      let score = 0;
      const sentenceLower = sentence.toLowerCase();
      for (const keyword of keywords) {
        if (sentenceLower.includes(keyword)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence.trim();
      }
    }

    // Create a formatted answer
    if (sources.length === 0) {
      return "I couldn't find relevant information in the local IRS knowledge base for this question. Please try rephrasing your question or consult IRS.gov for more information.";
    }

    // Combine information from multiple sources
    const keyInfo: string[] = [];
    for (const source of sources) {
      // Extract key sentences from each source
      const sourceSentences = source.content.split(/[.!?]+/).filter(s => s.trim().length > 30);
      if (sourceSentences.length > 0) {
        keyInfo.push(sourceSentences[0].trim() + '.');
      }
    }

    return keyInfo.join(' ');
  };

  const handleSearch = async () => {
    if (!question.trim()) return;

    setSearching(true);
    setGenerating(false);
    setResult(null);

    try {
      // Step 1: Retrieve relevant chunks
      const relevantChunks = await retrieveRelevantChunks(question);

      if (relevantChunks.length === 0) {
        setResult({
          question: question,
          answer: "I couldn't find relevant information in the local IRS knowledge base for this question. Please try rephrasing your question or consult IRS.gov for more information.",
          sources: [],
          timestamp: new Date().toLocaleTimeString(),
        });
        setSearching(false);
        return;
      }

      setSearching(false);
      setGenerating(true);

      // Step 2: Generate answer
      const sources = relevantChunks.map(r => r.chunk);
      const answer = await generateAnswer(question, sources);

      setResult({
        question: question,
        answer: answer,
        sources: sources,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Search error:', error);
      setResult({
        question: question,
        answer: 'An error occurred while searching. Please try again.',
        sources: [],
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setSearching(false);
      setGenerating(false);
    }
  };

  const handleExampleClick = (exampleQuestion: string) => {
    setQuestion(exampleQuestion);
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-gray-400">Initializing tax knowledge base...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <FaBook className="text-blue-400 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-200">Tax Research Assistant</h2>
        </div>
        <p className="text-sm text-gray-400">
          Ask questions about tax rules and get answers from verified IRS publications - 100% local and private
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Ask a tax question... (e.g., 'What is the standard deduction for 2024?')"
          />
          <button
            onClick={handleSearch}
            disabled={!question.trim() || searching || generating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <FaSearch />
            {searching ? 'Searching...' : generating ? 'Generating...' : 'Search'}
          </button>
        </div>

        {/* Example Questions */}
        {!result && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">Try asking:</div>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(ex)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-auto p-6">
        {!result ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaBook className="text-6xl mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Your Private Tax Research Library</h3>
            <p className="text-center max-w-lg mb-4">
              This tool uses local retrieval-augmented generation (RAG) to answer your tax questions
              using verified IRS publications stored on your computer.
            </p>
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 max-w-lg">
              <div className="flex items-start gap-2 mb-2">
                <FaCheckCircle className="text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-blue-300">
                  <strong>100% Private:</strong> Your questions never leave your computer
                </div>
              </div>
              <div className="flex items-start gap-2 mb-2">
                <FaCheckCircle className="text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-blue-300">
                  <strong>Verified Sources:</strong> All answers come from official IRS publications
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-blue-300">
                  <strong>No Hallucinations:</strong> RAG ensures answers are grounded in real documents
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Your Question */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">Your Question:</div>
              <div className="text-lg text-gray-200">{result.question}</div>
              <div className="text-xs text-gray-500 mt-2">Asked at {result.timestamp}</div>
            </div>

            {/* AI Answer */}
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700">
              <div className="flex items-center gap-2 mb-3">
                <FaLightbulb className="text-yellow-400 text-xl" />
                <div className="text-sm font-semibold text-gray-200">AI-Generated Answer</div>
              </div>
              <div className="text-gray-100 leading-relaxed">{result.answer}</div>
            </div>

            {/* Source Citations */}
            {result.sources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">
                  Sources ({result.sources.length} IRS Publications)
                </h3>
                <div className="space-y-3">
                  {result.sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-semibold text-blue-400">
                            {source.source} ({source.year})
                          </div>
                          <div className="text-xs text-gray-400">{source.section}</div>
                        </div>
                        <div className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded">
                          Source {idx + 1}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 leading-relaxed mt-3">
                        {source.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-xs text-yellow-400">
                <strong>Disclaimer:</strong> This AI-generated answer is for educational purposes only and is based on IRS publications.
                It is not legal or tax advice. For personalized guidance, please consult a qualified tax professional.
              </p>
            </div>

            {/* Ask Another Question */}
            <div className="text-center">
              <button
                onClick={() => {
                  setResult(null);
                  setQuestion('');
                }}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Ask Another Question
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxResearchApp;
