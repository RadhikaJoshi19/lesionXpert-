import React, { useState } from 'react';
import { StudyModule } from '../types';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  ChevronRight, 
  Award, 
  X, 
  Check, 
  ArrowRight,
  Flame,
  Search,
  BookMarked
} from 'lucide-react';

interface StudyResourcesViewProps {
  modules: StudyModule[];
  activeModule: StudyModule | null;
  onSelectModule: (module: StudyModule | null) => void;
  onToggleModuleCompletion: (moduleId: string) => void;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  highRiskTip?: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Which of the following intraoral anatomical sites carries the highest statistical risk for malignant transformation of Oral Leukoplakia?",
    options: [
      "Hard Palate and Attached Gingiva",
      "Lateral and Ventral Borders of the Tongue / Floor of Mouth",
      "Dorsal Surface of the Tongue",
      "Upper Labial Mucosa"
    ],
    correctIndex: 1,
    explanation: "The lateral border and ventral surface of the tongue along with the floor of the mouth are high-risk transformation zones due to thinner, non-keratinized epithelial barriers that permit carcinogen penetration.",
    highRiskTip: "Always palpate and inspect the 'horseshoe' floor-of-mouth area thoroughly during routine screening."
  },
  {
    id: 2,
    question: "What is the primary visual distinction between Homogeneous and Non-Homogeneous (Speckled) Leukoplakia?",
    options: [
      "Homogeneous leukoplakia is painful; speckled leukoplakia is asymptomatic",
      "Homogeneous leukoplakia can be wiped off with gauze; speckled cannot",
      "Non-homogeneous (speckled/erythroleukoplakic) presents with mixed red and white components and higher dysplasia risk",
      "Homogeneous occurs exclusively on the gingiva"
    ],
    correctIndex: 2,
    explanation: "Non-homogeneous leukoplakia (erythroleukoplakia/speckled) exhibits irregular surfaces with red erythematous zones indicating epithelial atrophy and carries a 4 to 7-fold higher transformation risk than uniform white plaques.",
    highRiskTip: "Incisional biopsy must be targeted specifically at the red, atrophic, or verrucous regions."
  },
  {
    id: 3,
    question: "In deep learning diagnostic triage (such as OPMD-AI), what does a high-intensity red region in a Grad-CAM saliency map represent?",
    options: [
      "Physical arterial blood flow detected by thermal sensor",
      "The spatial regions of the image that contributed most heavily to the neural network's class prediction",
      "Bacterial colonies on the mucosal biofilm",
      "Areas with low image focus variance"
    ],
    correctIndex: 1,
    explanation: "Grad-CAM calculates the gradients of the score for target class c with respect to the final convolutional feature maps, visually revealing which morphological textures (e.g. keratotic ridges, ulcer margins) steered the AI's diagnostic classification.",
    highRiskTip: "Clinicians should verify that the heatmap localizes precisely on the pathology rather than background dental artifacts."
  },
  {
    id: 4,
    question: "Which clinical feature is considered pathognomonic for Reticular Oral Lichen Planus (OLP)?",
    options: [
      "Erosive ulceration with bleeding on brushing",
      "Wickham's Striae: bilateral lace-like white keratotic lines",
      "Unilateral indurated mass with rolled borders",
      "Submucous fibrous bands restricting inter-incisal mouth opening"
    ],
    correctIndex: 1,
    explanation: "Wickham's striae are delicate, white, reticular or arborizing keratotic lines characteristically distributed bilaterally and symmetrically across the buccal mucosa in reticular OLP.",
    highRiskTip: "Bilateral mucosal symmetry helps differentiate OLP from unilateral leukoplakic lesions."
  },
  {
    id: 5,
    question: "According to the WHO 2024 protocol, what is the mandatory observation interval before biopsying a suspected reactive mucosal keratosis?",
    options: [
      "6 to 12 months",
      "14 days (2 weeks) following complete elimination of local mechanical/chemical irritants",
      "24 hours",
      "No observation is permitted; immediate excisional surgery is required"
    ],
    correctIndex: 1,
    explanation: "A standard 2-week observation period following removal of sharp cusps, smoking, or tobacco habits allows benign reactive inflammatory hyperkeratosis to resolve. Lesions persisting after 14 days require histopathologic evaluation.",
    highRiskTip: "Never defer biopsy beyond 14 days for persistent, unexplained, indurated mucosal lesions."
  }
];

export const StudyResourcesView: React.FC<StudyResourcesViewProps> = ({
  modules,
  activeModule,
  onSelectModule,
  onToggleModuleCompletion
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Quiz State
  const [quizOpen, setQuizOpen] = useState<boolean>(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const categories = ['All', 'Core Pathway', 'AI Technology', 'Pathology', 'Clinical Skills'];

  const filteredModules = modules.filter(m => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOptionSelect = (idx: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(idx);
    }
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === quizQuestions[currentQuizIndex].correctIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <BookOpen className="w-4 h-4 text-teal-600" />
            Curriculum & Continuing Medical Education
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-hanken">
            Educational Study Center
          </h1>
          <p className="text-sm text-slate-500">
            Self-paced masterclasses in OPMD recognition, WHO classification, and AI triage interpretability.
          </p>
        </div>

        <button
          onClick={() => { resetQuiz(); }}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <HelpCircle className="w-4 h-4 text-teal-400" />
          <span>Launch Clinical Quiz (5 Questions)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search study topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs text-slate-900"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredModules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => onSelectModule(mod)}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {mod.category}
                </span>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{mod.readTime}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 font-hanken group-hover:text-teal-700 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                {mod.completed ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${mod.progress}%` }}></div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{mod.progress}%</span>
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{mod.completed ? 'Read Again' : 'Start Reading'}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Module Reader Modal */}
      {activeModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">{activeModule.category}</span>
                  <h2 className="text-base sm:text-lg font-bold font-hanken">{activeModule.title}</h2>
                </div>
              </div>
              <button
                onClick={() => onSelectModule(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-slate-800 text-sm leading-relaxed">
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs text-teal-950 font-medium">
                {activeModule.description}
              </div>

              {activeModule.sections.map((section, idx) => (
                <div key={idx} className="space-y-3 pb-4 border-b border-slate-100 last:border-0">
                  <h3 className="text-base font-bold text-slate-900 font-hanken">
                    {section.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {section.content}
                  </p>

                  {section.keyPoints && section.keyPoints.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mt-3">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        Clinical Key Takeaways:
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {section.keyPoints.map((kp, kIdx) => (
                          <li key={kIdx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0"></span>
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onSelectModule(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleModuleCompletion(activeModule.id);
                  onSelectModule(null);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 ${
                  activeModule.completed
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{activeModule.completed ? 'Mark as In Progress' : 'Mark as Completed'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {quizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <h2 className="text-base font-bold font-hanken">OPMD Diagnostic Clinical Quiz</h2>
              </div>
              <button
                onClick={() => setQuizOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {!quizFinished ? (
                <>
                  {/* Progress Header */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-teal-700">
                      Question {currentQuizIndex + 1} of {quizQuestions.length}
                    </span>
                    <span className="font-mono text-slate-500">
                      Score: {quizScore} / {quizQuestions.length}
                    </span>
                  </div>

                  {/* Question */}
                  <h3 className="text-base font-bold text-slate-900 font-hanken leading-snug">
                    {quizQuestions[currentQuizIndex].question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {quizQuestions[currentQuizIndex].options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === quizQuestions[currentQuizIndex].correctIndex;
                      
                      let btnStyle = "border-slate-200 hover:bg-slate-50 text-slate-800";
                      if (isSelected) {
                        btnStyle = "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20 font-semibold";
                      }
                      if (isAnswerSubmitted) {
                        if (isCorrect) {
                          btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "border-rose-500 bg-rose-50 text-rose-900";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswerSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {isAnswerSubmitted && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 animate-in fade-in duration-200">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        Clinical Explanation:
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {quizQuestions[currentQuizIndex].explanation}
                      </p>
                      {quizQuestions[currentQuizIndex].highRiskTip && (
                        <div className="text-teal-800 font-semibold bg-teal-50 p-2 rounded-lg border border-teal-200/60">
                          Tip: {quizQuestions[currentQuizIndex].highRiskTip}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    {!isAnswerSubmitted ? (
                      <button
                        type="button"
                        onClick={handleQuizSubmit}
                        disabled={selectedOption === null}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                      >
                        <span>{currentQuizIndex < quizQuestions.length - 1 ? 'Next Question' : 'View Results'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* Quiz Complete Screen */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-hanken">Quiz Assessment Complete!</h3>
                  <div className="text-3xl font-black font-mono text-teal-700">
                    {quizScore} / {quizQuestions.length} ({(quizScore / quizQuestions.length * 100).toFixed(0)}%)
                  </div>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    {quizScore >= 4
                      ? "Outstanding performance! You have demonstrated advanced clinical acumen in OPMD diagnosis and risk stratification."
                      : "Good effort! Review the core modules on high-risk anatomical transformation zones and try again."}
                  </p>

                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={resetQuiz}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                    >
                      Retake Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-md"
                    >
                      Return to Study Center
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
